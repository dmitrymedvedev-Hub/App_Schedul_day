CREATE DATABASE IF NOT EXISTS day_scheduler;
USE day_scheduler;

CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  task_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  notes VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_task_date (task_date),
  INDEX idx_start_time (start_time)
);
