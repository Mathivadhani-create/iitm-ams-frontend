package store

import (
	"database/sql"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/iitm-ams/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type Store struct {
	mu            sync.RWMutex
	db            *sql.DB
	pgStore       *PGStore
	users         map[string]*models.User
	students      map[string]*models.Student
	faculties     map[string]*models.Faculty
	courses       map[string]*models.Course
	semesters     map[string]*models.Semester
	offerings     map[string]*models.CourseOffering
	registrations map[string]*models.Registration
	grades        map[string]*models.Grade
	notifications map[string]*models.Notification
}

func NewStore(db *sql.DB) *Store {
	s := &Store{
		db:            db,
		users:         make(map[string]*models.User),
		students:      make(map[string]*models.Student),
		faculties:     make(map[string]*models.Faculty),
		courses:       make(map[string]*models.Course),
		semesters:     make(map[string]*models.Semester),
		offerings:     make(map[string]*models.CourseOffering),
		registrations: make(map[string]*models.Registration),
		grades:        make(map[string]*models.Grade),
		notifications: make(map[string]*models.Notification),
	}

	if db != nil {
		s.pgStore = NewPGStore(db)
		if err := s.pgStore.SeedInitialData(); err != nil {
			fmt.Printf("[PostgreSQL] Seed Initial Data Note: %v\n", err)
		}
	} else {
		s.SeedInitialData()
	}
	return s
}

func (s *Store) SeedInitialData() {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Clear existing maps
	s.users = make(map[string]*models.User)
	s.students = make(map[string]*models.Student)
	s.faculties = make(map[string]*models.Faculty)
	s.courses = make(map[string]*models.Course)
	s.semesters = make(map[string]*models.Semester)
	s.offerings = make(map[string]*models.CourseOffering)
	s.registrations = make(map[string]*models.Registration)
	s.grades = make(map[string]*models.Grade)
	s.notifications = make(map[string]*models.Notification)

	saltHash, _ := bcrypt.GenerateFromPassword([]byte("Password123!"), bcrypt.DefaultCost)
	commonPass := string(saltHash)
	now := time.Now()

	// Users
	u1 := &models.User{ID: "00000000-0000-0000-0000-000000000001", Name: "Aravind Swaminathan", Email: "student1@iitm.ac.in", PasswordHash: commonPass, Role: models.RoleStudent, CreatedAt: now, UpdatedAt: now}
	u2 := &models.User{ID: "00000000-0000-0000-0000-000000000002", Name: "Ananya Sharma", Email: "student2@iitm.ac.in", PasswordHash: commonPass, Role: models.RoleStudent, CreatedAt: now, UpdatedAt: now}
	uf1 := &models.User{ID: "00000000-0000-0000-0000-000000000003", Name: "Prof. Ramesh Chandra", Email: "faculty1@iitm.ac.in", PasswordHash: commonPass, Role: models.RoleFaculty, CreatedAt: now, UpdatedAt: now}
	uf2 := &models.User{ID: "00000000-0000-0000-0000-000000000004", Name: "Prof. Sunita Krishnan", Email: "faculty2@iitm.ac.in", PasswordHash: commonPass, Role: models.RoleFaculty, CreatedAt: now, UpdatedAt: now}

	s.users[u1.ID] = u1
	s.users[u2.ID] = u2
	s.users[uf1.ID] = uf1
	s.users[uf2.ID] = uf2

	// Students
	std1 := &models.Student{ID: "10000000-0000-0000-0000-000000000001", UserID: u1.ID, RollNumber: "BE21B001", Department: "Computer Science & Engineering", Program: "B.Tech", Year: 3, CreatedAt: now, User: u1}
	std2 := &models.Student{ID: "10000000-0000-0000-0000-000000000002", UserID: u2.ID, RollNumber: "CS22M005", Department: "Computer Science & Engineering", Program: "M.Tech", Year: 2, CreatedAt: now, User: u2}

	s.students[std1.ID] = std1
	s.students[std2.ID] = std2

	// Faculty
	fac1 := &models.Faculty{ID: "20000000-0000-0000-0000-000000000001", UserID: uf1.ID, EmployeeID: "FAC101", Department: "Computer Science & Engineering", Designation: "Professor & HOD", CreatedAt: now, User: uf1}
	fac2 := &models.Faculty{ID: "20000000-0000-0000-0000-000000000002", UserID: uf2.ID, EmployeeID: "FAC102", Department: "Computer Science & Engineering", Designation: "Associate Professor", CreatedAt: now, User: uf2}

	s.faculties[fac1.ID] = fac1
	s.faculties[fac2.ID] = fac2

	// Courses
	c1 := &models.Course{ID: "30000000-0000-0000-0000-000000000001", CourseCode: "CS1010", CourseName: "Introduction to Programming", Description: "Fundamental principles of programming.", Credits: 4, Department: "Computer Science & Engineering", CreatedAt: now}
	c2 := &models.Course{ID: "30000000-0000-0000-0000-000000000002", CourseCode: "CS3100", CourseName: "Data Structures and Algorithms", Description: "Arrays, trees, graphs, and asymptotic runtime.", Credits: 4, Department: "Computer Science & Engineering", CreatedAt: now}
	c3 := &models.Course{ID: "30000000-0000-0000-0000-000000000003", CourseCode: "CS4200", CourseName: "Database Systems", Description: "Relational algebra, SQL, B-Trees, and transactions.", Credits: 4, Department: "Computer Science & Engineering", CreatedAt: now}

	s.courses[c1.ID] = c1
	s.courses[c2.ID] = c2
	s.courses[c3.ID] = c3

	// Semester
	regClose := now.Add(90 * 24 * time.Hour)
	sem := &models.Semester{ID: "40000000-0000-0000-0000-000000000001", Name: "July - November 2026 (Monsoon)", AcademicYear: "2026-2027", StartDate: "2026-07-25", EndDate: "2026-11-30", RegistrationOpen: true, RegistrationClose: &regClose}
	s.semesters[sem.ID] = sem

	// Course Offerings
	co1 := &models.CourseOffering{ID: "50000000-0000-0000-0000-000000000001", CourseID: c2.ID, FacultyID: fac1.ID, SemesterID: sem.ID, Capacity: 60, CreatedAt: now, Course: c2, Faculty: fac1, Semester: sem}
	co2 := &models.CourseOffering{ID: "50000000-0000-0000-0000-000000000002", CourseID: c3.ID, FacultyID: fac2.ID, SemesterID: sem.ID, Capacity: 50, CreatedAt: now, Course: c3, Faculty: fac2, Semester: sem}

	s.offerings[co1.ID] = co1
	s.offerings[co2.ID] = co2

	// Registrations & Grades
	reg1 := &models.Registration{ID: "60000000-0000-0000-0000-000000000001", StudentID: std1.ID, CourseOfferingID: co1.ID, RegisteredAt: now, Status: models.StatusRegistered, CourseOffering: co1}
	s.registrations[reg1.ID] = reg1

	grd1 := &models.Grade{ID: "70000000-0000-0000-0000-000000000001", RegistrationID: reg1.ID, Grade: models.GradeAPlus, GradePoint: 10.0, UploadedBy: fac1.ID, CreatedAt: now, UpdatedAt: now}
	s.grades[reg1.ID] = grd1
	reg1.Grade = grd1

	// Notifications
	notif1 := &models.Notification{ID: "80000000-0000-0000-0000-000000000001", UserID: u1.ID, Title: "Course Enrollment Confirmed", Message: "You have been successfully registered for CS3100: Data Structures and Algorithms.", Type: "registration", Read: false, CreatedAt: now}
	s.notifications[notif1.ID] = notif1
}

// User methods
func (s *Store) GetUserByEmail(email string) (*models.User, error) {
	if s.pgStore != nil {
		return s.pgStore.GetUserByEmail(email)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, u := range s.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}

func (s *Store) GetUserByID(id string) (*models.User, error) {
	if s.pgStore != nil {
		return s.pgStore.GetUserByID(id)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	u, exists := s.users[id]
	if !exists {
		return nil, fmt.Errorf("user not found")
	}
	return u, nil
}

func (s *Store) CreateUser(u *models.User) error {
	if s.pgStore != nil {
		return s.pgStore.CreateUser(u)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, existing := range s.users {
		if existing.Email == u.Email {
			return fmt.Errorf("email already in use")
		}
	}
	s.users[u.ID] = u
	return nil
}

// Student methods
func (s *Store) GetStudentByUserID(userID string) (*models.Student, error) {
	if s.pgStore != nil {
		return s.pgStore.GetStudentByUserID(userID)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, st := range s.students {
		if st.UserID == userID {
			return st, nil
		}
	}
	return nil, fmt.Errorf("student record not found")
}

func (s *Store) CreateStudent(st *models.Student) error {
	if s.pgStore != nil {
		return s.pgStore.CreateStudent(st)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	s.students[st.ID] = st
	return nil
}

// Faculty methods
func (s *Store) GetFacultyByUserID(userID string) (*models.Faculty, error) {
	if s.pgStore != nil {
		return s.pgStore.GetFacultyByUserID(userID)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, f := range s.faculties {
		if f.UserID == userID {
			return f, nil
		}
	}
	return nil, fmt.Errorf("faculty record not found")
}

// Course Offerings methods
func (s *Store) GetAvailableCourseOfferings() []*models.CourseOffering {
	if s.pgStore != nil {
		return s.pgStore.GetAvailableCourseOfferings()
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*models.CourseOffering
	for _, co := range s.offerings {
		count := 0
		for _, reg := range s.registrations {
			if reg.CourseOfferingID == co.ID && reg.Status == models.StatusRegistered {
				count++
			}
		}
		coCopy := *co
		coCopy.EnrolledCount = count
		result = append(result, &coCopy)
	}
	return result
}

func (s *Store) GetCourseOfferingByID(id string) (*models.CourseOffering, error) {
	if s.pgStore != nil {
		return s.pgStore.GetCourseOfferingByID(id)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	co, exists := s.offerings[id]
	if !exists {
		return nil, fmt.Errorf("course offering not found")
	}
	count := 0
	for _, reg := range s.registrations {
		if reg.CourseOfferingID == co.ID && reg.Status == models.StatusRegistered {
			count++
		}
	}
	coCopy := *co
	coCopy.EnrolledCount = count
	return &coCopy, nil
}

// Registrations methods
func (s *Store) GetStudentRegistrations(studentID string) []*models.Registration {
	if s.pgStore != nil {
		return s.pgStore.GetStudentRegistrations(studentID)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	var list []*models.Registration
	for _, reg := range s.registrations {
		if reg.StudentID == studentID {
			regCopy := *reg
			if grd, ok := s.grades[reg.ID]; ok {
				regCopy.Grade = grd
			}
			list = append(list, &regCopy)
		}
	}
	return list
}

func (s *Store) CreateRegistration(studentID, offeringID string) (*models.Registration, error) {
	if s.pgStore != nil {
		return s.pgStore.CreateRegistration(studentID, offeringID)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	co, ok := s.offerings[offeringID]
	if !ok {
		return nil, fmt.Errorf("course offering not found")
	}

	if co.Semester != nil && !co.Semester.RegistrationOpen {
		return nil, fmt.Errorf("registration period for this semester is closed")
	}

	for _, reg := range s.registrations {
		if reg.StudentID == studentID && reg.CourseOfferingID == offeringID && reg.Status == models.StatusRegistered {
			return nil, fmt.Errorf("student is already registered for this course offering")
		}
	}

	enrolled := 0
	for _, reg := range s.registrations {
		if reg.CourseOfferingID == offeringID && reg.Status == models.StatusRegistered {
			enrolled++
		}
	}

	if enrolled >= co.Capacity {
		return nil, fmt.Errorf("course offering capacity reached (%d/%d)", enrolled, co.Capacity)
	}

	newReg := &models.Registration{
		ID:               "reg-" + uuid.New().String()[:8],
		StudentID:        studentID,
		CourseOfferingID: offeringID,
		RegisteredAt:     time.Now(),
		Status:           models.StatusRegistered,
		CourseOffering:   co,
	}

	s.registrations[newReg.ID] = newReg

	notif := &models.Notification{
		ID:        "notif-" + uuid.New().String()[:8],
		UserID:    s.getStudentUserID(studentID),
		Title:     "Course Registration Confirmed",
		Message:   fmt.Sprintf("Registered for course offering %s.", co.Course.CourseCode),
		Type:      "registration",
		Read:      false,
		CreatedAt: time.Now(),
	}
	s.notifications[notif.ID] = notif

	return newReg, nil
}

func (s *Store) DropRegistration(studentID, regID string) error {
	if s.pgStore != nil {
		return s.pgStore.DropRegistration(studentID, regID)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	reg, ok := s.registrations[regID]
	if !ok {
		return fmt.Errorf("registration record not found")
	}

	if reg.StudentID != studentID {
		return fmt.Errorf("unauthorized to drop this registration")
	}

	reg.Status = models.StatusDropped
	return nil
}

func (s *Store) getStudentUserID(studentID string) string {
	if st, ok := s.students[studentID]; ok {
		return st.UserID
	}
	return ""
}

// Grades methods
func (s *Store) GetStudentGrades(studentID string) []*models.Registration {
	if s.pgStore != nil {
		return s.pgStore.GetStudentGrades(studentID)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*models.Registration
	for _, reg := range s.registrations {
		if reg.StudentID == studentID && reg.Status == models.StatusRegistered {
			grd, ok := s.grades[reg.ID]
			if ok && grd.PublishedAt != nil {
				regCopy := *reg
				regCopy.Grade = grd
				result = append(result, &regCopy)
			}
		}
	}
	return result
}

func (s *Store) SaveGrade(facultyID, regID string, gradeLetter models.GradeLetter) (*models.Grade, error) {
	if s.pgStore != nil {
		return s.pgStore.SaveGrade(facultyID, regID, gradeLetter)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	reg, ok := s.registrations[regID]
	if !ok {
		return nil, fmt.Errorf("registration record not found")
	}

	co, ok := s.offerings[reg.CourseOfferingID]
	if !ok || co.FacultyID != facultyID {
		return nil, fmt.Errorf("unauthorized: faculty is not assigned to teach this course offering")
	}

	gp, err := GetGradePoint(gradeLetter)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	existingGrade, exists := s.grades[regID]
	if exists {
		existingGrade.Grade = gradeLetter
		existingGrade.GradePoint = gp
		existingGrade.UpdatedAt = now
		return existingGrade, nil
	}

	newGrade := &models.Grade{
		ID:             "grd-" + uuid.New().String()[:8],
		RegistrationID: regID,
		Grade:          gradeLetter,
		GradePoint:     gp,
		UploadedBy:     facultyID,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	s.grades[regID] = newGrade
	reg.Grade = newGrade
	return newGrade, nil
}

func (s *Store) PublishGrades(facultyID, offeringID string) ([]*models.Student, *models.CourseOffering, error) {
	if s.pgStore != nil {
		return s.pgStore.PublishGrades(facultyID, offeringID)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	co, ok := s.offerings[offeringID]
	if !ok {
		return nil, nil, fmt.Errorf("course offering not found")
	}

	if co.FacultyID != facultyID {
		return nil, nil, fmt.Errorf("unauthorized: faculty is not assigned to teach this course offering")
	}

	var notifiedStudents []*models.Student
	now := time.Now()

	for _, reg := range s.registrations {
		if reg.CourseOfferingID == offeringID && reg.Status == models.StatusRegistered {
			if grd, ok := s.grades[reg.ID]; ok {
				grd.PublishedAt = &now

				if st, ok := s.students[reg.StudentID]; ok {
					notifiedStudents = append(notifiedStudents, st)

					notif := &models.Notification{
						ID:        "notif-" + uuid.New().String()[:8],
						UserID:    st.UserID,
						Title:     "Grade Published",
						Message:   fmt.Sprintf("Your grade for %s (%s) has been published: Grade %s.", co.Course.CourseName, co.Course.CourseCode, grd.Grade),
						Type:      "grade_published",
						Read:      false,
						CreatedAt: now,
					}
					s.notifications[notif.ID] = notif
				}
			}
		}
	}

	return notifiedStudents, co, nil
}

// Notifications methods
func (s *Store) GetUserNotifications(userID string) []*models.Notification {
	if s.pgStore != nil {
		return s.pgStore.GetUserNotifications(userID)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*models.Notification
	for _, n := range s.notifications {
		if n.UserID == userID {
			result = append(result, n)
		}
	}
	return result
}

func (s *Store) MarkNotificationRead(userID, notifID string) error {
	if s.pgStore != nil {
		return s.pgStore.MarkNotificationRead(userID, notifID)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	n, ok := s.notifications[notifID]
	if !ok {
		return fmt.Errorf("notification not found")
	}

	if n.UserID != userID {
		return fmt.Errorf("unauthorized to mark this notification")
	}

	n.Read = true
	return nil
}

// Helper: Faculty Assigned Courses & Enrolled Students
func (s *Store) GetFacultyOfferings(facultyID string) []*models.CourseOffering {
	if s.pgStore != nil {
		return s.pgStore.GetFacultyOfferings(facultyID)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*models.CourseOffering
	for _, co := range s.offerings {
		if co.FacultyID == facultyID {
			count := 0
			for _, reg := range s.registrations {
				if reg.CourseOfferingID == co.ID && reg.Status == models.StatusRegistered {
					count++
				}
			}
			coCopy := *co
			coCopy.EnrolledCount = count
			result = append(result, &coCopy)
		}
	}
	return result
}

func (s *Store) GetEnrolledStudentsForOffering(facultyID, offeringID string) ([]map[string]interface{}, error) {
	if s.pgStore != nil {
		return s.pgStore.GetEnrolledStudentsForOffering(facultyID, offeringID)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	co, ok := s.offerings[offeringID]
	if !ok {
		return nil, fmt.Errorf("course offering not found")
	}

	if co.FacultyID != facultyID {
		return nil, fmt.Errorf("unauthorized: faculty is not assigned to teach this course offering")
	}

	var result []map[string]interface{}
	for _, reg := range s.registrations {
		if reg.CourseOfferingID == offeringID && reg.Status == models.StatusRegistered {
			st := s.students[reg.StudentID]
			grd := s.grades[reg.ID]

			item := map[string]interface{}{
				"registration_id": reg.ID,
				"student_id":      reg.StudentID,
				"student_name":    st.User.Name,
				"roll_number":     st.RollNumber,
				"department":      st.Department,
				"program":         st.Program,
				"registered_at":   reg.RegisteredAt,
				"grade":           grd,
			}
			result = append(result, item)
		}
	}
	return result, nil
}

func GetGradePoint(g models.GradeLetter) (float64, error) {
	switch g {
	case models.GradeAPlus, models.GradeA:
		return 10.0, nil
	case models.GradeAMinus:
		return 9.0, nil
	case models.GradeBPlus:
		return 8.0, nil
	case models.GradeB:
		return 7.0, nil
	case models.GradeBMinus:
		return 6.0, nil
	case models.GradeCPlus:
		return 5.0, nil
	case models.GradeC:
		return 4.0, nil
	case models.GradeCMinus:
		return 3.0, nil
	case models.GradeD:
		return 2.0, nil
	case models.GradeF:
		return 0.0, nil
	default:
		return 0.0, fmt.Errorf("invalid grade '%s'. Allowed grades are: A+, A, A-, B+, B, B-, C+, C, C-, D, F", g)
	}
}

// Faculty Create Method
func (s *Store) CreateFaculty(f *models.Faculty) error {
	if s.pgStore != nil {
		return s.pgStore.CreateFaculty(f)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for _, existing := range s.faculties {
		if existing.UserID == f.UserID {
			return fmt.Errorf("faculty record already exists")
		}

		if f.EmployeeID != "" && existing.EmployeeID == f.EmployeeID {
			return fmt.Errorf("employee ID already in use")
		}
	}

	s.faculties[f.ID] = f

	return nil
}
