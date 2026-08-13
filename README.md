# IIT Madras Academic Management System (IITM AMS)

Production-Ready Academic Management System built for the **IIT Madras Full-Stack Engineering Challenge**.

---

## Deployment Architecture Overview

- **React Frontend**: Deployed on **Netlify**
- **Go Backend**: Deployed as a Dockerized web service on **Render**
- **PostgreSQL Database**: Provisioned on **Render PostgreSQL** (or managed PostgreSQL host)

---

## A. Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Launch Application in Development**:
   ```bash
   npm run dev
   ```

3. **Run Go Backend Standalone**:
   ```bash
   cd backend
   export DATABASE_URL="postgres://postgres:postgres@localhost:5432/iitm_ams?sslmode=disable"
   export PORT=8080
   export JWT_SECRET="dev-secret-key"
   go run cmd/server/main.go
   ```

4. **Run Backend Test Suite**:
   ```bash
   cd backend
   DATABASE_URL="postgres://postgres:postgres@localhost:5432/iitm_ams?sslmode=disable" go test -v ./...
   ```

---

## B. PostgreSQL Setup & Automated Migrations

1. **Local Database Creation**:
   ```bash
   createdb -U postgres iitm_ams
   ```

2. **Schema Migration**:
   The Go backend automatically executes schema migration file `backend/migrations/000001_init.up.sql` on startup upon database connection.
   
   To apply migrations manually:
   ```bash
   psql -U postgres -d iitm_ams -f backend/migrations/000001_init.up.sql
   ```

---

## C. Environment Variables Reference

### Backend (`backend/.env` or Render Web Service Environment)

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `PORT` | Dynamic port provided by host | `8080` (or injected automatically by Render) |
| `DATABASE_URL` | PostgreSQL Connection String | `postgres://user:pass@ep-xyz.render.com/iitm_ams?sslmode=require` |
| `JWT_SECRET` | Strong secret key for signing JWT tokens | `generate-random-32-char-string-in-production` |
| `JWT_EXPIRATION_HOURS` | Token validity duration in hours | `24` |
| `CORS_ORIGIN` | Allowed origin for frontend SPA requests | `https://iitm-ams.netlify.app` |
| `ENABLE_EMAIL` | Enable or disable outbound email dispatch | `false` (or `true` if SMTP configured) |
| `SMTP_HOST` | SMTP server host | `smtp.mailtrap.io` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USERNAME` | SMTP username | `your_smtp_username` |
| `SMTP_PASSWORD` | SMTP password | `your_smtp_password` |
| `SMTP_FROM` | Sender email address | `noreply@iitm.ac.in` |

### Frontend (`.env` or Netlify Environment)

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Public production URL of the deployed Go API | `https://iitm-ams-backend.onrender.com` |

---

## D. Go Backend Deployment on Render

### Option 1: Automatic Blueprint (`render.yaml`)
1. In Render Dashboard, click **New +** -> **Blueprint**.
2. Connect your repository. Render will automatically detect `render.yaml` and create both the PostgreSQL database (`iitm-ams-postgres`) and the Web Service (`iitm-ams-backend`).
3. Update the `CORS_ORIGIN` environment variable in the Web Service to match your deployed Netlify URL.

### Option 2: Manual Setup on Render
1. **Create PostgreSQL Database**:
   - Go to Render -> **New +** -> **PostgreSQL**.
   - Name: `iitm-ams-postgres`, Database Name: `iitm_ams`.
   - Copy the **Internal Database URL** (or External URL).

2. **Create Web Service**:
   - Go to Render -> **New +** -> **Web Service**.
   - Connect your repository.
   - Environment: **Docker**
   - Docker Command Path: `./backend/Dockerfile`
   - Build Context: `./backend`
   - Set Environment Variables:
     - `PORT`: `8080` (or leave default for Render dynamic assignment)
     - `DATABASE_URL`: `<Render PostgreSQL Connection String>`
     - `JWT_SECRET`: `<Generate strong 32+ char secret>`
     - `CORS_ORIGIN`: `https://<your-app-name>.netlify.app`
     - `ENABLE_EMAIL`: `false`
3. Click **Deploy Web Service**. On startup, the server connects to PostgreSQL and runs `migrations/000001_init.up.sql` automatically.

---

## E. React Frontend Deployment on Netlify

1. Go to **Netlify Dashboard** -> **Add new site** -> **Import an existing project**.
2. Connect your GitHub repository.
3. Configure Site Build Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add Environment Variable in Netlify (**Site settings** -> **Environment variables**):
   - Key: `VITE_API_URL`
   - Value: `https://<your-render-backend-name>.onrender.com`
5. Click **Deploy Site**.
6. SPA route redirection is handled automatically via `public/_redirects` (`/* /index.html 200`) and `netlify.toml`.

---

## F. Production Test Checklist

After deployment, perform these verification steps on the live application:

### 1. Student Portal Flow
- [ ] **Login**: Login with `student1@iitm.ac.in` / `Password123!`. Verify JWT token is saved in `localStorage`.
- [ ] **Profile**: Verify student details load (Roll Number: `BE21B001`, Department: CSE, Program: B.Tech).
- [ ] **View Courses**: Navigate to Course Catalog. Confirm active semester offerings load.
- [ ] **Register Course**: Register for an available offering. Verify successful registration.
- [ ] **Duplicate Registration Check**: Attempt to register for the same offering again. Confirm 409 Conflict error message appears.
- [ ] **View Registrations**: Navigate to My Registrations. Confirm registered course appears.
- [ ] **View Grades**: Navigate to Grades & CGPA. Verify credit points and GPA calculation.
- [ ] **View Notifications**: Open notifications modal/page. Mark a notification as read.

### 2. Faculty Portal Flow
- [ ] **Login**: Login with `faculty1@iitm.ac.in` / `Password123!`.
- [ ] **View Assigned Courses**: Verify assigned course offerings display.
- [ ] **View Enrolled Students**: Open student roster for assigned course (e.g. `CS3100`).
- [ ] **Upload Grade**: Assign a letter grade (e.g. `A+`) to a student and save as draft.
- [ ] **Publish Grades**: Click **Publish Grades**. Confirm published count and timestamp update.
- [ ] **Verify Notification**: Log back in as `student1@iitm.ac.in` and verify the grade publication notification appears.

### 3. Security Enforcement
- [ ] **Cross-Role Endpoint Security**: Access `/api/faculty/courses` using student token -> Verify `403 Forbidden`.
- [ ] **Unauthorized Course Access**: Access roster/grades for an unassigned course offering as faculty -> Verify `403 Forbidden`.
- [ ] **Unauthenticated Access**: Call `/api/student/profile` without `Authorization` header -> Verify `401 Unauthorized`.

---

## G. Development & Test Credentials

> **Note**: The following credentials are provided strictly for development, evaluation, and automated testing purposes.

| Role | Email | Password | Identifier / Role Details |
| :--- | :--- | :--- | :--- |
| **Student 1** | `student1@iitm.ac.in` | `Password123!` | Aravind S. (Roll: `BE21B001`, B.Tech CSE) |
| **Student 2** | `student2@iitm.ac.in` | `Password123!` | Ananya S. (Roll: `CS22M005`, M.Tech CSE) |
| **Faculty 1** | `faculty1@iitm.ac.in` | `Password123!` | Prof. Ramesh Chandra (Emp: `FAC101`) |
| **Faculty 2** | `faculty2@iitm.ac.in` | `Password123!` | Prof. Sunita Krishnan (Emp: `FAC102`) |

