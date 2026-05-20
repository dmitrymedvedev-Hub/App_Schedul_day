# App_Schedul_day

A lightweight web app to schedule your day, manage tasks, and optimize time.

## Features

- Add tasks with duration and priority
- Automatically optimizes task order (high priority first, then shorter tasks)
- Shows planned minutes and free time in an 8-hour day
- Builds a simple timeline starting at 09:00
- Saves tasks in browser localStorage

## Usage

Open `index.html` in your browser.
Professional daily scheduling web app using:
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express.js
- **Database:** MySQL (managed with phpMyAdmin)

## Features
- Create, update, delete daily tasks
- Filter tasks by date
- Priority and status management
- Professional responsive UI

## Project Structure
- `server.js` - Express server and API routes
- `db.js` - MySQL connection pool
- `public/` - Frontend files (`index.html`, `styles.css`, `app.js`)
- `schema.sql` - Database schema for phpMyAdmin import

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and set your MySQL credentials.
3. In phpMyAdmin, import `schema.sql` (or run it in SQL tab).
4. Start the app:
   ```bash
   npm run start
   ```
5. Open `http://localhost:3000`.

## API Endpoints
- `GET /api/health`
- `GET /api/schedules?date=YYYY-MM-DD`
- `POST /api/schedules`
- `PUT /api/schedules/:id`
- `DELETE /api/schedules/:id`
