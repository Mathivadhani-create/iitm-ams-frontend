package store

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/iitm-ams/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type PGStore struct {
	db *sql.DB
}

func NewPGStore(db *sql.DB) *PGStore {
	return &PGStore{db: db}
}

func (s *PGStore) SeedInitialData() error {
	saltHash, _ := bcrypt.GenerateFromPassword([]byte("Password123!"), bcrypt.DefaultCost)
	commonPass := string(saltHash)
	now := time.Now()

	// Users
	users := []*models.User{
		{ID: "00000000-0000-0000-0000-000000000001", Name: "Aravind Swaminathan", Email: "student1@iitm.ac.in", PasswordHash: commonPass, Role: models.RoleStudent, CreatedAt: now, UpdatedAt: now},
		{ID: "00000000-0000-0000-0000-000000000002", Name: "Ananya Sharma", Email: "student2@iitm.ac.in", PasswordHash: commonPass, Role: models.RoleStudent, CreatedAt: now, UpdatedAt: now},
		{ID: "00000000-0000-0000-0000-000000000003", Name: "Prof. Ramesh Chandra", Email: "faculty1@iitm.ac.in", PasswordHash: commonPass, Role: models.RoleFaculty, CreatedAt: now, UpdatedAt: now},
		{ID: "00000000-0000-0000-0000-000000000004", Name: "Prof. Sunita Krishnan", Email: "faculty2@iitm.ac.in", PasswordHash: commonPass, Role: models.RoleFaculty, CreatedAt: now, UpdatedAt: now},
	}

	for _, u := range users {
		query := `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name;`
		if _, err := s.db.Exec(query, u.ID, u.Name, u.Email, u.PasswordHash, u.Role, u.CreatedAt, u.UpdatedAt); err != nil {
			return fmt.Errorf("failed seeding user %s: %w", u.Email, err)
		}
	}

	// Students
	students := []*models.Student{
		{ID: "10000000-0000-0000-0000-000000000001", UserID: "00000000-0000-0000-0000-000000000001", RollNumber: "BE21B001", Department: "Computer Science & Engineering", Program: "B.Tech", Year: 3, CreatedAt: now},
		{ID: "10000000-0000-0000-0000-000000000002", UserID: "00000000-0000-0000-0000-000000000002", RollNumber: "CS22M005", Department: "Computer Science & Engineering", Program: "M.Tech", Year: 2, CreatedAt: now},
	}

	for _, st := range students {
		query := `INSERT INTO students (id, user_id, roll_number, department, program, year, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (roll_number) DO NOTHING;`
		if _, err := s.db.Exec(query, st.ID, st.UserID, st.RollNumber, st.Department, st.Program, st.Year, st.CreatedAt); err != nil {
			return fmt.Errorf("failed seeding student %s: %w", st.RollNumber, err)
		}
	}

	// Faculty
	faculties := []*models.Faculty{
		{ID: "20000000-0000-0000-0000-000000000001", UserID: "00000000-0000-0000-0000-000000000003", EmployeeID: "FAC101", Department: "Computer Science & Engineering", Designation: "Professor & HOD", CreatedAt: now},
		{ID: "20000000-0000-0000-0000-000000000002", UserID: "00000000-0000-0000-0000-000000000004", EmployeeID: "FAC102", Department: "Computer Science & Engineering", Designation: "Associate Professor", CreatedAt: now},
	}

	for _, f := range faculties {
		query := `INSERT INTO faculty (id, user_id, employee_id, department, designation, created_at)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (employee_id) DO NOTHING;`
		if _, err := s.db.Exec(query, f.ID, f.UserID, f.EmployeeID, f.Department, f.Designation, f.CreatedAt); err != nil {
			return fmt.Errorf("failed seeding faculty %s: %w", f.EmployeeID, err)
		}
	}

	// Courses
	courses := []*models.Course{
		{ID: "30000000-0000-0000-0000-000000000001", CourseCode: "CS1010", CourseName: "Introduction to Programming", Description: "Fundamental principles of programming.", Credits: 4, Department: "Computer Science & Engineering", CreatedAt: now},
		{ID: "30000000-0000-0000-0000-000000000002", CourseCode: "CS3100", CourseName: "Data Structures and Algorithms", Description: "Arrays, trees, graphs, and asymptotic runtime.", Credits: 4, Department: "Computer Science & Engineering", CreatedAt: now},
		{ID: "30000000-0000-0000-0000-000000000003", CourseCode: "CS4200", CourseName: "Database Systems", Description: "Relational algebra, SQL, B-Trees, and transactions.", Credits: 4, Department: "Computer Science & Engineering", CreatedAt: now},
	}

	for _, c := range courses {
		query := `INSERT INTO courses (id, course_code, course_name, description, credits, department, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (course_code) DO NOTHING;`
		if _, err := s.db.Exec(query, c.ID, c.CourseCode, c.CourseName, c.Description, c.Credits, c.Department, c.CreatedAt); err != nil {
			return fmt.Errorf("failed seeding course %s: %w", c.CourseCode, err)
		}
	}

	// Semester
	regClose := now.Add(90 * 24 * time.Hour)
	semID := "40000000-0000-0000-0000-000000000001"
	semQuery := `INSERT INTO semesters (id, name, academic_year, start_date, end_date, registration_open, registration_close)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO NOTHING;`
	if _, err := s.db.Exec(semQuery, semID, "July - November 2026 (Monsoon)", "2026-2027", "2026-07-25", "2026-11-30", true, regClose); err != nil {
		return fmt.Errorf("failed seeding semester: %w", err)
	}

	// Course Offerings
	offerings := []*models.CourseOffering{
		{ID: "50000000-0000-0000-0000-000000000001", CourseID: "30000000-0000-0000-0000-000000000002", FacultyID: "20000000-0000-0000-0000-000000000001", SemesterID: semID, Capacity: 60, CreatedAt: now},
		{ID: "50000000-0000-0000-0000-000000000002", CourseID: "30000000-0000-0000-0000-000000000003", FacultyID: "20000000-0000-0000-0000-000000000002", SemesterID: semID, Capacity: 50, CreatedAt: now},
	}

	for _, co := range offerings {
		query := `INSERT INTO course_offerings (id, course_id, faculty_id, semester_id, capacity, created_at)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (course_id, semester_id) DO NOTHING;`
		if _, err := s.db.Exec(query, co.ID, co.CourseID, co.FacultyID, co.SemesterID, co.Capacity, co.CreatedAt); err != nil {
			return fmt.Errorf("failed seeding offering: %w", err)
		}
	}

	// Seed 1 Registration and Grade
	regID := "60000000-0000-0000-0000-000000000001"
	regQuery := `INSERT INTO registrations (id, student_id, course_offering_id, registered_at, status)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (student_id, course_offering_id) DO NOTHING;`
	s.db.Exec(regQuery, regID, "10000000-0000-0000-0000-000000000001", "50000000-0000-0000-0000-000000000001", now, models.StatusRegistered)

	grdQuery := `INSERT INTO grades (id, registration_id, grade, grade_point, uploaded_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (registration_id) DO NOTHING;`
	s.db.Exec(grdQuery, "70000000-0000-0000-0000-000000000001", regID, models.GradeAPlus, 10.0, "20000000-0000-0000-0000-000000000001", now, now)

	// Seed Notification
	notifQuery := `INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO NOTHING;`
	s.db.Exec(notifQuery, "80000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000001", "Course Enrollment Confirmed", "You have been successfully registered for CS3100: Data Structures and Algorithms.", "registration", false, now)

	return nil
}

// GetUserByEmail
func (s *PGStore) GetUserByEmail(email string) (*models.User, error) {
	u := &models.User{}
	query := `SELECT id, name, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1`
	err := s.db.QueryRow(query, email).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return u, nil
}

// GetUserByID
func (s *PGStore) GetUserByID(id string) (*models.User, error) {
	u := &models.User{}
	query := `SELECT id, name, email, password_hash, role, created_at, updated_at FROM users WHERE id = $1`
	err := s.db.QueryRow(query, id).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return u, nil
}

// CreateUser
func (s *PGStore) CreateUser(u *models.User) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	now := time.Now()
	u.CreatedAt = now
	u.UpdatedAt = now

	query := `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := s.db.Exec(query, u.ID, u.Name, u.Email, u.PasswordHash, u.Role, u.CreatedAt, u.UpdatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			return fmt.Errorf("email already in use")
		}
		return err
	}
	return nil
}

// GetStudentByUserID
func (s *PGStore) GetStudentByUserID(userID string) (*models.Student, error) {
	st := &models.Student{}
	u := &models.User{}

	query := `SELECT s.id, s.user_id, s.roll_number, s.department, s.program, s.year, s.created_at,
		u.id, u.name, u.email, u.role, u.created_at, u.updated_at
		FROM students s
		JOIN users u ON s.user_id = u.id
		WHERE s.user_id = $1`

	err := s.db.QueryRow(query, userID).Scan(
		&st.ID, &st.UserID, &st.RollNumber, &st.Department, &st.Program, &st.Year, &st.CreatedAt,
		&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("student record not found: %w", err)
	}
	st.User = u
	return st, nil
}

// CreateStudent
func (s *PGStore) CreateStudent(st *models.Student) error {
	if st.ID == "" {
		st.ID = uuid.New().String()
	}
	st.CreatedAt = time.Now()

	query := `INSERT INTO students (id, user_id, roll_number, department, program, year, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := s.db.Exec(query, st.ID, st.UserID, st.RollNumber, st.Department, st.Program, st.Year, st.CreatedAt)
	return err
}

// GetFacultyByUserID
func (s *PGStore) GetFacultyByUserID(userID string) (*models.Faculty, error) {
	f := &models.Faculty{}
	u := &models.User{}

	query := `SELECT f.id, f.user_id, f.employee_id, f.department, f.designation, f.created_at,
		u.id, u.name, u.email, u.role, u.created_at, u.updated_at
		FROM faculty f
		JOIN users u ON f.user_id = u.id
		WHERE f.user_id = $1`

	err := s.db.QueryRow(query, userID).Scan(
		&f.ID, &f.UserID, &f.EmployeeID, &f.Department, &f.Designation, &f.CreatedAt,
		&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("faculty record not found: %w", err)
	}
	f.User = u
	return f, nil
}

// GetAvailableCourseOfferings
func (s *PGStore) GetAvailableCourseOfferings() []*models.CourseOffering {
	query := `SELECT co.id, co.course_id, co.faculty_id, co.semester_id, co.capacity, co.created_at,
		c.id, c.course_code, c.course_name, c.description, c.credits, c.department, c.created_at,
		f.id, f.user_id, f.employee_id, f.department, f.designation, f.created_at,
		fu.id, fu.name, fu.email, fu.role, fu.created_at, fu.updated_at,
		sem.id, sem.name, sem.academic_year, sem.start_date, sem.end_date, sem.registration_open, sem.registration_close,
		(SELECT COUNT(*) FROM registrations r WHERE r.course_offering_id = co.id AND r.status = 'registered') as enrolled_count
		FROM course_offerings co
		JOIN courses c ON co.course_id = c.id
		JOIN faculty f ON co.faculty_id = f.id
		JOIN users fu ON f.user_id = fu.id
		JOIN semesters sem ON co.semester_id = sem.id`

	rows, err := s.db.Query(query)
	if err != nil {
		return []*models.CourseOffering{}
	}
	defer rows.Close()

	var list []*models.CourseOffering
	for rows.Next() {
		co := &models.CourseOffering{}
		c := &models.Course{}
		f := &models.Faculty{}
		fu := &models.User{}
		sem := &models.Semester{}

		err := rows.Scan(
			&co.ID, &co.CourseID, &co.FacultyID, &co.SemesterID, &co.Capacity, &co.CreatedAt,
			&c.ID, &c.CourseCode, &c.CourseName, &c.Description, &c.Credits, &c.Department, &c.CreatedAt,
			&f.ID, &f.UserID, &f.EmployeeID, &f.Department, &f.Designation, &f.CreatedAt,
			&fu.ID, &fu.Name, &fu.Email, &fu.Role, &fu.CreatedAt, &fu.UpdatedAt,
			&sem.ID, &sem.Name, &sem.AcademicYear, &sem.StartDate, &sem.EndDate, &sem.RegistrationOpen, &sem.RegistrationClose,
			&co.EnrolledCount,
		)
		if err == nil {
			f.User = fu
			co.Course = c
			co.Faculty = f
			co.Semester = sem
			list = append(list, co)
		}
	}
	return list
}

func (s *PGStore) GetCourseOfferingByID(id string) (*models.CourseOffering, error) {
	query := `SELECT co.id, co.course_id, co.faculty_id, co.semester_id, co.capacity, co.created_at,
		c.id, c.course_code, c.course_name, c.description, c.credits, c.department, c.created_at,
		f.id, f.user_id, f.employee_id, f.department, f.designation, f.created_at,
		fu.id, fu.name, fu.email, fu.role, fu.created_at, fu.updated_at,
		sem.id, sem.name, sem.academic_year, sem.start_date, sem.end_date, sem.registration_open, sem.registration_close,
		(SELECT COUNT(*) FROM registrations r WHERE r.course_offering_id = co.id AND r.status = 'registered') as enrolled_count
		FROM course_offerings co
		JOIN courses c ON co.course_id = c.id
		JOIN faculty f ON co.faculty_id = f.id
		JOIN users fu ON f.user_id = fu.id
		JOIN semesters sem ON co.semester_id = sem.id
		WHERE co.id = $1`

	co := &models.CourseOffering{}
	c := &models.Course{}
	f := &models.Faculty{}
	fu := &models.User{}
	sem := &models.Semester{}

	err := s.db.QueryRow(query, id).Scan(
		&co.ID, &co.CourseID, &co.FacultyID, &co.SemesterID, &co.Capacity, &co.CreatedAt,
		&c.ID, &c.CourseCode, &c.CourseName, &c.Description, &c.Credits, &c.Department, &c.CreatedAt,
		&f.ID, &f.UserID, &f.EmployeeID, &f.Department, &f.Designation, &f.CreatedAt,
		&fu.ID, &fu.Name, &fu.Email, &fu.Role, &fu.CreatedAt, &fu.UpdatedAt,
		&sem.ID, &sem.Name, &sem.AcademicYear, &sem.StartDate, &sem.EndDate, &sem.RegistrationOpen, &sem.RegistrationClose,
		&co.EnrolledCount,
	)
	if err != nil {
		return nil, fmt.Errorf("course offering not found: %w", err)
	}
	f.User = fu
	co.Course = c
	co.Faculty = f
	co.Semester = sem
	return co, nil
}

// GetStudentRegistrations
func (s *PGStore) GetStudentRegistrations(studentID string) []*models.Registration {
	query := `SELECT r.id, r.student_id, r.course_offering_id, r.registered_at, r.status,
		co.id, co.course_id, co.faculty_id, co.semester_id, co.capacity, co.created_at,
		c.id, c.course_code, c.course_name, c.description, c.credits, c.department, c.created_at,
		f.id, f.user_id, f.employee_id, f.department, f.designation, f.created_at,
		fu.id, fu.name, fu.email, fu.role, fu.created_at, fu.updated_at,
		sem.id, sem.name, sem.academic_year, sem.start_date, sem.end_date, sem.registration_open, sem.registration_close,
		g.id, g.grade, g.grade_point, g.uploaded_by, g.published_at, g.created_at, g.updated_at
		FROM registrations r
		JOIN course_offerings co ON r.course_offering_id = co.id
		JOIN courses c ON co.course_id = c.id
		JOIN faculty f ON co.faculty_id = f.id
		JOIN users fu ON f.user_id = fu.id
		JOIN semesters sem ON co.semester_id = sem.id
		LEFT JOIN grades g ON g.registration_id = r.id
		WHERE r.student_id = $1`

	rows, err := s.db.Query(query, studentID)
	if err != nil {
		return []*models.Registration{}
	}
	defer rows.Close()

	var list []*models.Registration
	for rows.Next() {
		reg := &models.Registration{}
		co := &models.CourseOffering{}
		c := &models.Course{}
		f := &models.Faculty{}
		fu := &models.User{}
		sem := &models.Semester{}

		var gID, gGrade, gUploadedBy sql.NullString
		var gGradePoint sql.NullFloat64
		var gPublishedAt, gCreatedAt, gUpdatedAt sql.NullTime

		err := rows.Scan(
			&reg.ID, &reg.StudentID, &reg.CourseOfferingID, &reg.RegisteredAt, &reg.Status,
			&co.ID, &co.CourseID, &co.FacultyID, &co.SemesterID, &co.Capacity, &co.CreatedAt,
			&c.ID, &c.CourseCode, &c.CourseName, &c.Description, &c.Credits, &c.Department, &c.CreatedAt,
			&f.ID, &f.UserID, &f.EmployeeID, &f.Department, &f.Designation, &f.CreatedAt,
			&fu.ID, &fu.Name, &fu.Email, &fu.Role, &fu.CreatedAt, &fu.UpdatedAt,
			&sem.ID, &sem.Name, &sem.AcademicYear, &sem.StartDate, &sem.EndDate, &sem.RegistrationOpen, &sem.RegistrationClose,
			&gID, &gGrade, &gGradePoint, &gUploadedBy, &gPublishedAt, &gCreatedAt, &gUpdatedAt,
		)
		if err == nil {
			f.User = fu
			co.Course = c
			co.Faculty = f
			co.Semester = sem
			reg.CourseOffering = co

			if gID.Valid {
				grd := &models.Grade{
					ID:             gID.String,
					RegistrationID: reg.ID,
					Grade:          models.GradeLetter(gGrade.String),
					GradePoint:     gGradePoint.Float64,
					UploadedBy:     gUploadedBy.String,
				}
				if gPublishedAt.Valid {
					grd.PublishedAt = &gPublishedAt.Time
				}
				if gCreatedAt.Valid {
					grd.CreatedAt = gCreatedAt.Time
				}
				if gUpdatedAt.Valid {
					grd.UpdatedAt = gUpdatedAt.Time
				}
				reg.Grade = grd
			}
			list = append(list, reg)
		}
	}
	return list
}

// CreateRegistration
func (s *PGStore) CreateRegistration(studentID, offeringID string) (*models.Registration, error) {
	co, err := s.GetCourseOfferingByID(offeringID)
	if err != nil {
		return nil, fmt.Errorf("invalid course offering: %w", err)
	}

	if co.Semester != nil && !co.Semester.RegistrationOpen {
		return nil, fmt.Errorf("registration period for this semester is closed")
	}

	if co.EnrolledCount >= co.Capacity {
		return nil, fmt.Errorf("course offering capacity reached (%d/%d)", co.EnrolledCount, co.Capacity)
	}

	regID := uuid.New().String()
	now := time.Now()

	query := `INSERT INTO registrations (id, student_id, course_offering_id, registered_at, status) VALUES ($1, $2, $3, $4, $5)`
	_, err = s.db.Exec(query, regID, studentID, offeringID, now, models.StatusRegistered)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			return nil, fmt.Errorf("student is already registered for this course offering")
		}
		return nil, fmt.Errorf("failed to register course: %w", err)
	}

	// Fetch student user_id for notification
	var userID string
	s.db.QueryRow(`SELECT user_id FROM students WHERE id = $1`, studentID).Scan(&userID)

	if userID != "" {
		notifID := uuid.New().String()
		notifQuery := `INSERT INTO notifications (id, user_id, title, message, type, read, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`
		s.db.Exec(notifQuery, notifID, userID, "Course Registration Confirmed", fmt.Sprintf("Registered for course offering %s.", co.Course.CourseCode), "registration", false, now)
	}

	return &models.Registration{
		ID:               regID,
		StudentID:        studentID,
		CourseOfferingID: offeringID,
		RegisteredAt:     now,
		Status:           models.StatusRegistered,
		CourseOffering:   co,
	}, nil
}

// DropRegistration
func (s *PGStore) DropRegistration(studentID, regID string) error {
	var ownerID string
	err := s.db.QueryRow(`SELECT student_id FROM registrations WHERE id = $1`, regID).Scan(&ownerID)
	if err != nil {
		return fmt.Errorf("registration record not found")
	}

	if ownerID != studentID {
		return fmt.Errorf("unauthorized to drop this registration")
	}

	_, err = s.db.Exec(`UPDATE registrations SET status = 'dropped' WHERE id = $1`, regID)
	return err
}

// GetStudentGrades
func (s *PGStore) GetStudentGrades(studentID string) []*models.Registration {
	allRegs := s.GetStudentRegistrations(studentID)
	var list []*models.Registration
	for _, reg := range allRegs {
		if reg.Status == models.StatusRegistered && reg.Grade != nil && reg.Grade.PublishedAt != nil {
			list = append(list, reg)
		}
	}
	return list
}

// SaveGrade
func (s *PGStore) SaveGrade(facultyID, regID string, gradeLetter models.GradeLetter) (*models.Grade, error) {
	var offeringFacultyID string
	err := s.db.QueryRow(`
		SELECT co.faculty_id
		FROM registrations r
		JOIN course_offerings co ON r.course_offering_id = co.id
		WHERE r.id = $1`, regID).Scan(&offeringFacultyID)

	if err != nil {
		return nil, fmt.Errorf("registration record not found")
	}

	if offeringFacultyID != facultyID {
		return nil, fmt.Errorf("unauthorized: faculty is not assigned to teach this course offering")
	}

	gp, err := GetGradePoint(gradeLetter)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	grdID := uuid.New().String()

	query := `INSERT INTO grades (id, registration_id, grade, grade_point, uploaded_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (registration_id) DO UPDATE SET grade = EXCLUDED.grade, grade_point = EXCLUDED.grade_point, updated_at = EXCLUDED.updated_at
		RETURNING id, published_at`

	var returnedID string
	var publishedAt sql.NullTime
	err = s.db.QueryRow(query, grdID, regID, gradeLetter, gp, facultyID, now, now).Scan(&returnedID, &publishedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to save grade: %w", err)
	}

	grd := &models.Grade{
		ID:             returnedID,
		RegistrationID: regID,
		Grade:          gradeLetter,
		GradePoint:     gp,
		UploadedBy:     facultyID,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	if publishedAt.Valid {
		grd.PublishedAt = &publishedAt.Time
	}
	return grd, nil
}

// PublishGrades
func (s *PGStore) PublishGrades(facultyID, offeringID string) ([]*models.Student, *models.CourseOffering, error) {
	co, err := s.GetCourseOfferingByID(offeringID)
	if err != nil {
		return nil, nil, fmt.Errorf("course offering not found")
	}

	if co.FacultyID != facultyID {
		return nil, nil, fmt.Errorf("unauthorized: faculty is not assigned to teach this course offering")
	}

	now := time.Now()

	updateQuery := `
		UPDATE grades SET published_at = $1
		WHERE registration_id IN (
			SELECT id FROM registrations WHERE course_offering_id = $2 AND status = 'registered'
		)`
	_, err = s.db.Exec(updateQuery, now, offeringID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to publish grades: %w", err)
	}

	// Retrieve students
	studentRows, err := s.db.Query(`
		SELECT st.id, st.user_id, st.roll_number, st.department, st.program, st.year, st.created_at,
		u.id, u.name, u.email, u.role, u.created_at, u.updated_at
		FROM registrations r
		JOIN students st ON r.student_id = st.id
		JOIN users u ON st.user_id = u.id
		JOIN grades g ON g.registration_id = r.id
		WHERE r.course_offering_id = $1 AND r.status = 'registered'`, offeringID)

	var students []*models.Student
	if err == nil {
		defer studentRows.Close()
		for studentRows.Next() {
			st := &models.Student{}
			u := &models.User{}
			if err := studentRows.Scan(&st.ID, &st.UserID, &st.RollNumber, &st.Department, &st.Program, &st.Year, &st.CreatedAt, &u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt, &u.UpdatedAt); err == nil {
				st.User = u
				students = append(students, st)

				// Create student notification
				notifID := uuid.New().String()
				notifQuery := `INSERT INTO notifications (id, user_id, title, message, type, read, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`
				s.db.Exec(notifQuery, notifID, st.UserID, "Grade Published", fmt.Sprintf("Your grade for %s (%s) has been published.", co.Course.CourseName, co.Course.CourseCode), "grade_published", false, now)
			}
		}
	}

	return students, co, nil
}

// GetUserNotifications
func (s *PGStore) GetUserNotifications(userID string) []*models.Notification {
	query := `SELECT id, user_id, title, message, type, read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := s.db.Query(query, userID)
	if err != nil {
		return []*models.Notification{}
	}
	defer rows.Close()

	var list []*models.Notification
	for rows.Next() {
		n := &models.Notification{}
		if err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Message, &n.Type, &n.Read, &n.CreatedAt); err == nil {
			list = append(list, n)
		}
	}
	return list
}

// MarkNotificationRead
func (s *PGStore) MarkNotificationRead(userID, notifID string) error {
	res, err := s.db.Exec(`UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`, notifID, userID)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("notification not found")
	}
	return nil
}

// GetFacultyOfferings
func (s *PGStore) GetFacultyOfferings(facultyID string) []*models.CourseOffering {
	query := `SELECT co.id, co.course_id, co.faculty_id, co.semester_id, co.capacity, co.created_at,
		c.id, c.course_code, c.course_name, c.description, c.credits, c.department, c.created_at,
		f.id, f.user_id, f.employee_id, f.department, f.designation, f.created_at,
		fu.id, fu.name, fu.email, fu.role, fu.created_at, fu.updated_at,
		sem.id, sem.name, sem.academic_year, sem.start_date, sem.end_date, sem.registration_open, sem.registration_close,
		(SELECT COUNT(*) FROM registrations r WHERE r.course_offering_id = co.id AND r.status = 'registered') as enrolled_count
		FROM course_offerings co
		JOIN courses c ON co.course_id = c.id
		JOIN faculty f ON co.faculty_id = f.id
		JOIN users fu ON f.user_id = fu.id
		JOIN semesters sem ON co.semester_id = sem.id
		WHERE co.faculty_id = $1`

	rows, err := s.db.Query(query, facultyID)
	if err != nil {
		return []*models.CourseOffering{}
	}
	defer rows.Close()

	var list []*models.CourseOffering
	for rows.Next() {
		co := &models.CourseOffering{}
		c := &models.Course{}
		f := &models.Faculty{}
		fu := &models.User{}
		sem := &models.Semester{}

		err := rows.Scan(
			&co.ID, &co.CourseID, &co.FacultyID, &co.SemesterID, &co.Capacity, &co.CreatedAt,
			&c.ID, &c.CourseCode, &c.CourseName, &c.Description, &c.Credits, &c.Department, &c.CreatedAt,
			&f.ID, &f.UserID, &f.EmployeeID, &f.Department, &f.Designation, &f.CreatedAt,
			&fu.ID, &fu.Name, &fu.Email, &fu.Role, &fu.CreatedAt, &fu.UpdatedAt,
			&sem.ID, &sem.Name, &sem.AcademicYear, &sem.StartDate, &sem.EndDate, &sem.RegistrationOpen, &sem.RegistrationClose,
			&co.EnrolledCount,
		)
		if err == nil {
			f.User = fu
			co.Course = c
			co.Faculty = f
			co.Semester = sem
			list = append(list, co)
		}
	}
	return list
}

// GetEnrolledStudentsForOffering
func (s *PGStore) GetEnrolledStudentsForOffering(facultyID, offeringID string) ([]map[string]interface{}, error) {
	co, err := s.GetCourseOfferingByID(offeringID)
	if err != nil {
		return nil, fmt.Errorf("course offering not found")
	}

	if co.FacultyID != facultyID {
		return nil, fmt.Errorf("unauthorized: faculty is not assigned to teach this course offering")
	}

	query := `SELECT r.id, r.student_id, r.registered_at,
		st.roll_number, st.department, st.program,
		u.name,
		g.id, g.grade, g.grade_point, g.uploaded_by, g.published_at, g.created_at, g.updated_at
		FROM registrations r
		JOIN students st ON r.student_id = st.id
		JOIN users u ON st.user_id = u.id
		LEFT JOIN grades g ON g.registration_id = r.id
		WHERE r.course_offering_id = $1 AND r.status = 'registered'`

	rows, err := s.db.Query(query, offeringID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var regID, studentID, roll, dept, prog, name string
		var regAt time.Time
		var gID, gGrade, gUploadedBy sql.NullString
		var gGradePoint sql.NullFloat64
		var gPublishedAt, gCreatedAt, gUpdatedAt sql.NullTime

		if err := rows.Scan(&regID, &studentID, &regAt, &roll, &dept, &prog, &name, &gID, &gGrade, &gGradePoint, &gUploadedBy, &gPublishedAt, &gCreatedAt, &gUpdatedAt); err == nil {
			var grd *models.Grade
			if gID.Valid {
				grd = &models.Grade{
					ID:             gID.String,
					RegistrationID: regID,
					Grade:          models.GradeLetter(gGrade.String),
					GradePoint:     gGradePoint.Float64,
					UploadedBy:     gUploadedBy.String,
				}
				if gPublishedAt.Valid {
					grd.PublishedAt = &gPublishedAt.Time
				}
			}

			item := map[string]interface{}{
				"registration_id": regID,
				"student_id":      studentID,
				"student_name":    name,
				"roll_number":     roll,
				"department":      dept,
				"program":         prog,
				"registered_at":   regAt,
				"grade":           grd,
			}
			result = append(result, item)
		}
	}
	return result, nil
}
