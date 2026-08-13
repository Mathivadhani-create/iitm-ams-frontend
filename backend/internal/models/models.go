package models

import "time"

type UserRole string

const (
	RoleStudent UserRole = "student"
	RoleFaculty UserRole = "faculty"
	RoleAdmin   UserRole = "admin"
)

type User struct {
	ID           string    `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Role         UserRole  `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type Student struct {
	ID         string    `json:"id" db:"id"`
	UserID     string    `json:"user_id" db:"user_id"`
	RollNumber string    `json:"roll_number" db:"roll_number"`
	Department string    `json:"department" db:"department"`
	Program    string    `json:"program" db:"program"`
	Year       int       `json:"year" db:"year"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	User       *User     `json:"user,omitempty"`
}

type Faculty struct {
	ID          string    `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	EmployeeID  string    `json:"employee_id" db:"employee_id"`
	Department  string    `json:"department" db:"department"`
	Designation string    `json:"designation" db:"designation"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	User        *User     `json:"user,omitempty"`
}

type Course struct {
	ID          string    `json:"id" db:"id"`
	CourseCode  string    `json:"course_code" db:"course_code"`
	CourseName  string    `json:"course_name" db:"course_name"`
	Description string    `json:"description" db:"description"`
	Credits     int       `json:"credits" db:"credits"`
	Department  string    `json:"department" db:"department"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Semester struct {
	ID                string     `json:"id" db:"id"`
	Name              string     `json:"name" db:"name"`
	AcademicYear      string     `json:"academic_year" db:"academic_year"`
	StartDate         string     `json:"start_date" db:"start_date"`
	EndDate           string     `json:"end_date" db:"end_date"`
	RegistrationOpen  bool       `json:"registration_open" db:"registration_open"`
	RegistrationClose *time.Time `json:"registration_close" db:"registration_close"`
}

type CourseOffering struct {
	ID            string    `json:"id" db:"id"`
	CourseID      string    `json:"course_id" db:"course_id"`
	FacultyID     string    `json:"faculty_id" db:"faculty_id"`
	SemesterID    string    `json:"semester_id" db:"semester_id"`
	Capacity      int       `json:"capacity" db:"capacity"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	Course        *Course   `json:"course,omitempty"`
	Faculty       *Faculty  `json:"faculty,omitempty"`
	Semester      *Semester `json:"semester,omitempty"`
	EnrolledCount int       `json:"enrolled_count,omitempty"`
}

type RegistrationStatus string

const (
	StatusRegistered RegistrationStatus = "registered"
	StatusDropped    RegistrationStatus = "dropped"
)

type Registration struct {
	ID               string             `json:"id" db:"id"`
	StudentID        string             `json:"student_id" db:"student_id"`
	CourseOfferingID string             `json:"course_offering_id" db:"course_offering_id"`
	RegisteredAt     time.Time          `json:"registered_at" db:"registered_at"`
	Status           RegistrationStatus `json:"status" db:"status"`
	CourseOffering   *CourseOffering    `json:"course_offering,omitempty"`
	Grade            *Grade             `json:"grade,omitempty"`
}

type GradeLetter string

const (
	GradeAPlus GradeLetter = "A+"
	GradeA     GradeLetter = "A"
	GradeAMinus GradeLetter = "A-"
	GradeBPlus GradeLetter = "B+"
	GradeB     GradeLetter = "B"
	GradeBMinus GradeLetter = "B-"
	GradeCPlus GradeLetter = "C+"
	GradeC     GradeLetter = "C"
	GradeCMinus GradeLetter = "C-"
	GradeD     GradeLetter = "D"
	GradeF     GradeLetter = "F"
)

type Grade struct {
	ID             string     `json:"id" db:"id"`
	RegistrationID string     `json:"registration_id" db:"registration_id"`
	Grade          GradeLetter `json:"grade" db:"grade"`
	GradePoint     float64    `json:"grade_point" db:"grade_point"`
	UploadedBy     string     `json:"uploaded_by" db:"uploaded_by"`
	PublishedAt    *time.Time `json:"published_at" db:"published_at"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
}

type Notification struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Title     string    `json:"title" db:"title"`
	Message   string    `json:"message" db:"message"`
	Type      string    `json:"type" db:"type"`
	Read      bool      `json:"read" db:"read"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type ApiResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
