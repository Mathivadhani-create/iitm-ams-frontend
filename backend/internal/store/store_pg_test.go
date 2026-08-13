package store

import (
	"os"
	"testing"

	"github.com/iitm-ams/backend/internal/database"
	"github.com/iitm-ams/backend/internal/models"
)

func getTestPGDB(t *testing.T) *database.DB {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://pguser@127.0.0.1:5433/iitm_ams?sslmode=disable"
	}

	db, err := database.Connect(connStr)
	if err != nil {
		t.Skipf("Skipping PostgreSQL integration test: %v", err)
	}

	// Run migration
	if err := db.RunMigrations(); err != nil {
		t.Fatalf("Failed running migration: %v", err)
	}

	return db
}

func TestPostgreSQLStoreIntegration(t *testing.T) {
	db := getTestPGDB(t)
	defer db.Close()

	pgStore := NewPGStore(db.Conn)

	// 1. Seed initial data
	err := pgStore.SeedInitialData()
	if err != nil {
		t.Fatalf("SeedInitialData failed: %v", err)
	}

	// 2. Verify User lookup
	user, err := pgStore.GetUserByEmail("student1@iitm.ac.in")
	if err != nil || user == nil {
		t.Fatalf("GetUserByEmail failed: %v", err)
	}
	if user.Role != models.RoleStudent {
		t.Fatalf("Expected student role, got %s", user.Role)
	}

	// 3. Verify Student lookup
	student, err := pgStore.GetStudentByUserID(user.ID)
	if err != nil || student == nil {
		t.Fatalf("GetStudentByUserID failed: %v", err)
	}
	if student.RollNumber != "BE21B001" {
		t.Fatalf("Expected roll number BE21B001, got %s", student.RollNumber)
	}

	// 4. Verify Faculty lookup
	facUser, err := pgStore.GetUserByEmail("faculty1@iitm.ac.in")
	if err != nil || facUser == nil {
		t.Fatalf("Faculty user lookup failed: %v", err)
	}
	fac, err := pgStore.GetFacultyByUserID(facUser.ID)
	if err != nil || fac == nil {
		t.Fatalf("GetFacultyByUserID failed: %v", err)
	}
	if fac.EmployeeID != "FAC101" {
		t.Fatalf("Expected FAC101, got %s", fac.EmployeeID)
	}

	// 5. Verify Course Offerings
	offerings := pgStore.GetAvailableCourseOfferings()
	if len(offerings) == 0 {
		t.Fatalf("Expected course offerings, got 0")
	}

	// 6. Verify Registration creation and duplicate handling
	offeringID := offerings[0].ID
	reg, err := pgStore.CreateRegistration(student.ID, offeringID)
	if err != nil {
		// Should fail if already registered from seed
		t.Logf("CreateRegistration returned expected duplicate error or registration: %v", err)
	} else {
		if reg.StudentID != student.ID {
			t.Fatalf("Registration student ID mismatch")
		}
	}

	// Try duplicate registration - must fail with unique constraint
	_, dupErr := pgStore.CreateRegistration(student.ID, offeringID)
	if dupErr == nil {
		t.Fatalf("Expected error for duplicate registration, got nil")
	}

	// 7. Test Grade Save & Publish
	regs := pgStore.GetStudentRegistrations(student.ID)
	if len(regs) > 0 {
		regToGrade := regs[0]
		grd, err := pgStore.SaveGrade(fac.ID, regToGrade.ID, models.GradeAPlus)
		if err != nil {
			t.Logf("SaveGrade result: %v (faculty %s might not match offering faculty %s)", err, fac.ID, regToGrade.CourseOffering.FacultyID)
		} else if grd != nil {
			if grd.Grade != models.GradeAPlus {
				t.Fatalf("Expected grade A+, got %s", grd.Grade)
			}
		}

		// Publish grades for offering
		publishedStudents, pubOffering, pubErr := pgStore.PublishGrades(regToGrade.CourseOffering.FacultyID, regToGrade.CourseOffering.ID)
		if pubErr != nil {
			t.Fatalf("PublishGrades failed: %v", pubErr)
		}
		if pubOffering == nil {
			t.Fatalf("Expected published offering")
		}
		t.Logf("Published grades for %d students", len(publishedStudents))
	}

	// 8. Test Notifications
	notifs := pgStore.GetUserNotifications(user.ID)
	if len(notifs) == 0 {
		t.Fatalf("Expected notifications for student user, got 0")
	}

	// Mark notification read
	err = pgStore.MarkNotificationRead(user.ID, notifs[0].ID)
	if err != nil {
		t.Fatalf("MarkNotificationRead failed: %v", err)
	}
}
