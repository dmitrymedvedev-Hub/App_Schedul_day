const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const database = process.env.DB_NAME || 'day_scheduler';

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool({
  ...baseConfig,
  database
});

const tableExists = async (connection, tableName) => {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.tables
     WHERE table_schema = ? AND table_name = ?`,
    [database, tableName]
  );
  return rows[0].count > 0;
};

const columnExists = async (connection, tableName, columnName) => {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
    [database, tableName, columnName]
  );
  return rows[0].count > 0;
};

const indexExists = async (connection, tableName, indexName) => {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.statistics
     WHERE table_schema = ? AND table_name = ? AND index_name = ?`,
    [database, tableName, indexName]
  );
  return rows[0].count > 0;
};

const constraintExists = async (connection, constraintName) => {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.table_constraints
     WHERE table_schema = ? AND constraint_name = ?`,
    [database, constraintName]
  );
  return rows[0].count > 0;
};

const addColumnIfMissing = async (connection, tableName, columnName, definition) => {
  if (!(await columnExists(connection, tableName, columnName))) {
    await connection.query(`ALTER TABLE ${mysql.escapeId(tableName)} ADD COLUMN ${definition}`);
  }
};

const addIndexIfMissing = async (connection, tableName, indexName, definition) => {
  if (!(await indexExists(connection, tableName, indexName))) {
    await connection.query(`CREATE INDEX ${mysql.escapeId(indexName)} ON ${mysql.escapeId(tableName)} ${definition}`);
  }
};

const createUsersTable = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const createSchedulesTable = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(150) NOT NULL,
      task_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
      status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
      notes VARCHAR(500) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_schedules_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_date (user_id, task_date),
      INDEX idx_task_date (task_date),
      INDEX idx_start_time (start_time)
    )
  `);
};

const ensureLegacyOwner = async (connection) => {
  const passwordHash = 'legacy:account-cannot-sign-in';
  await connection.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ('Imported User', 'imported@local.scheduler', ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [passwordHash]
  );

  const [rows] = await connection.query(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    ['imported@local.scheduler']
  );
  return rows[0].id;
};

const migrateSchedulesTable = async (connection) => {
  await addColumnIfMissing(connection, 'schedules', 'title', 'title VARCHAR(150) NOT NULL DEFAULT "Untitled activity"');
  await addColumnIfMissing(connection, 'schedules', 'task_date', 'task_date DATE NOT NULL DEFAULT (CURRENT_DATE)');
  await addColumnIfMissing(connection, 'schedules', 'start_time', 'start_time TIME NOT NULL DEFAULT "09:00:00"');
  await addColumnIfMissing(connection, 'schedules', 'end_time', 'end_time TIME NOT NULL DEFAULT "10:00:00"');
  await addColumnIfMissing(
    connection,
    'schedules',
    'priority',
    'priority ENUM("low", "medium", "high") NOT NULL DEFAULT "medium"'
  );
  await addColumnIfMissing(
    connection,
    'schedules',
    'status',
    'status ENUM("pending", "in_progress", "completed") NOT NULL DEFAULT "pending"'
  );
  await addColumnIfMissing(connection, 'schedules', 'notes', 'notes VARCHAR(500) DEFAULT ""');
  await addColumnIfMissing(
    connection,
    'schedules',
    'created_at',
    'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  );
  await addColumnIfMissing(
    connection,
    'schedules',
    'updated_at',
    'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  );

  if (!(await columnExists(connection, 'schedules', 'user_id'))) {
    const legacyUserId = await ensureLegacyOwner(connection);
    await connection.query('ALTER TABLE schedules ADD COLUMN user_id INT NULL AFTER id');
    await connection.query('UPDATE schedules SET user_id = ? WHERE user_id IS NULL', [legacyUserId]);
    await connection.query('ALTER TABLE schedules MODIFY user_id INT NOT NULL');
  }

  await addIndexIfMissing(connection, 'schedules', 'idx_user_date', '(user_id, task_date)');
  await addIndexIfMissing(connection, 'schedules', 'idx_task_date', '(task_date)');
  await addIndexIfMissing(connection, 'schedules', 'idx_start_time', '(start_time)');

  if (!(await constraintExists(connection, 'fk_schedules_user'))) {
    await connection.query(
      `ALTER TABLE schedules
       ADD CONSTRAINT fk_schedules_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
    );
  }
};

const initializeDatabase = async () => {
  const connection = await mysql.createConnection(baseConfig);

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(database)}`);
    await connection.query(`USE ${mysql.escapeId(database)}`);
    await createUsersTable(connection);

    if (await tableExists(connection, 'schedules')) {
      await migrateSchedulesTable(connection);
    } else {
      await createSchedulesTable(connection);
    }
  } finally {
    await connection.end();
  }
};

module.exports = {
  initializeDatabase,
  pool
};
