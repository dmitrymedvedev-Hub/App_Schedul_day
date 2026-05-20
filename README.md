# DayStride

DayStride is a professional daily planning workspace with account access, user-owned activities, profile insights, and a polished light/dark interface.

## Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express.js
- **Database:** MySQL (managed with phpMyAdmin)

## Features

- Sign up and sign in with hashed passwords and signed auth tokens
- Home page with today's schedule summary
- Dashboard page with metrics, timeline, and status balance
- My Activities page for creating, updating, deleting, and filtering activities
- Profile page with account details, editable profile settings, and productivity insights
- Collapsible navigation menu with responsive overlay behavior
- Activity search plus date, status, and priority filters
- Page-specific color themes and motion for a polished product feel
- Persistent professional light and dark mode
- User-owned activity records
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
2. Create `.env` from `.env.example` and set your MySQL credentials and `AUTH_SECRET`.
3. Start the app:
   ```bash
   npm run start
   ```
4. Open `http://localhost:3000`.

The server creates the database tables automatically when MySQL is connected. You can still import `schema.sql` manually in phpMyAdmin if you prefer.

## Checks

```bash
npm test
```

This runs JavaScript syntax checks for the server, database module, and frontend app script.

## API Endpoints

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `GET /api/schedules?date=YYYY-MM-DD`
- `POST /api/schedules`
- `PUT /api/schedules/:id`
- `DELETE /api/schedules/:id`
