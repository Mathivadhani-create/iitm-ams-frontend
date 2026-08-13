# IIT Madras Academic Management System (IITM AMS) - REST API Documentation

Official REST API specification for the **IIT Madras Academic Management System**.

---

## Base URL
Local Development: `http://localhost:3000/api`  
Render Production: `https://iitm-ams-backend.onrender.com/api`

---

## Authentication & Headers
All protected endpoints require a JWT Bearer Token in the HTTP Authorization header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Registers a new Student or Faculty user account.

**Request Body:**
```json
{
  "name": "Aditi Sharma",
  "email": "aditi.sharma@iitm.ac.in",
  "password": "Password123!",
  "role": "student", // "student" or "faculty"
  "department": "Computer Science & Engineering",
  "program": "B.Tech",
  "year": 1
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "u-1723456789",
      "name": "Aditi Sharma",
      "email": "aditi.sharma@iitm.ac.in",
      "role": "student",
      "studentId": "std-1723456789"
    }
  }
}
```

---

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT access token.

**Request Body:**
```json
{
  "email": "student1@iitm.ac.in",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "u-std-1",
      "name": "Aravind Swaminathan",
      "email": "student1@iitm.ac.in",
      "role": "student",
      "studentId": "std-1"
    }
  }
}
```

---

### `GET /api/auth/me`
Retrieves current authenticated user session details and profile records.

---

## 2. Student Endpoints (Role: `student`)

### `GET /api/student/profile`
Returns student roll number, academic program, department, and registration timestamp.

### `GET /api/student/courses`
Returns available course offerings for the current active semester.

### `GET /api/student/registrations`
Returns student's enrolled courses and grade status.

### `POST /api/student/registrations`
Enrolls student into a course offering.

**Request Body:**
```json
{
  "course_offering_id": "co-cs3100-2026jul"
}
```

**Error Responses:**
- `400 Bad Request`: Semester registration closed.
- `409 Conflict`: Student is already registered or course capacity limit reached.

---

### `DELETE /api/student/registrations/:id`
Drops an active course registration.

### `GET /api/student/grades`
Calculates student's Cumulative GPA (CGPA) and returns published letter grades.

---

## 3. Faculty Endpoints (Role: `faculty`)

### `GET /api/faculty/courses`
Returns course offerings assigned to the logged-in faculty member.

### `GET /api/faculty/courses/:id/students`
Returns student roster for assigned course offering.  
*Enforces Rule 3: Returns 403 Forbidden if accessed by non-assigned faculty.*

### `POST /api/faculty/courses/:id/grades`
Uploads or updates draft letter grade for an enrolled student.

**Allowed Letter Grades:** `A+`, `A`, `A-`, `B+`, `B`, `B-`, `C+`, `C`, `C-`, `D`, `F`.

### `POST /api/faculty/courses/:id/publish-grades`
Finalizes grades for the course offering.
1. Saves grades to database with `published_at` timestamp.
2. Creates in-app student notifications.
3. Dispatches email notifications via `EmailService`.
