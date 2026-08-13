package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/iitm-ams/backend/internal/config"
	"github.com/iitm-ams/backend/internal/middleware"
	"github.com/iitm-ams/backend/internal/models"
	"github.com/iitm-ams/backend/internal/services"
	"github.com/iitm-ams/backend/internal/store"
)

func setupTestApp() (*mux.Router, *store.Store, *config.Config) {
	cfg := &config.Config{
		Port:        "8080",
		JWTSecret:   "test-jwt-secret-key",
		CORSOrigin:  "*",
		EnableEmail: false,
	}

	st := store.NewStore(nil)
	emailSvc := services.NewEmailService(cfg)

	authH := NewAuthHandler(st, cfg)
	studentH := NewStudentHandler(st)
	facultyH := NewFacultyHandler(st, emailSvc)
	adminH := NewAdminHandler(st)

	r := mux.NewRouter()

	r.HandleFunc("/api/auth/login", authH.Login).Methods("POST")

	adminSub := r.PathPrefix("/api/admin").Subrouter()
	adminSub.Use(middleware.JWTAuthMiddleware(cfg.JWTSecret))
	adminSub.Use(middleware.RequireRole(models.RoleAdmin))
	adminSub.HandleFunc("/reset-seed", adminH.ResetSeed).Methods("POST")

	stdSub := r.PathPrefix("/api/student").Subrouter()
	stdSub.Use(middleware.JWTAuthMiddleware(cfg.JWTSecret))
	stdSub.Use(middleware.RequireRole(models.RoleStudent))
	stdSub.HandleFunc("/profile", studentH.GetProfile).Methods("GET")
	stdSub.HandleFunc("/courses", studentH.GetAvailableCourses).Methods("GET")
	stdSub.HandleFunc("/registrations", studentH.GetRegistrations).Methods("GET")
	stdSub.HandleFunc("/registrations", studentH.RegisterCourse).Methods("POST")
	stdSub.HandleFunc("/registrations/{id}", studentH.DropCourse).Methods("DELETE")
	stdSub.HandleFunc("/grades", studentH.GetGrades).Methods("GET")

	facSub := r.PathPrefix("/api/faculty").Subrouter()
	facSub.Use(middleware.JWTAuthMiddleware(cfg.JWTSecret))
	facSub.Use(middleware.RequireRole(models.RoleFaculty))
	facSub.HandleFunc("/profile", facultyH.GetProfile).Methods("GET")
	facSub.HandleFunc("/courses", facultyH.GetAssignedCourses).Methods("GET")
	facSub.HandleFunc("/courses/{id}/students", facultyH.GetEnrolledStudents).Methods("GET")
	facSub.HandleFunc("/courses/{id}/grades", facultyH.UploadGrade).Methods("POST")
	facSub.HandleFunc("/courses/{id}/publish-grades", facultyH.PublishGrades).Methods("POST")

	return r, st, cfg
}

func TestLoginSuccess(t *testing.T) {
	r, _, _ := setupTestApp()

	payload := map[string]string{
		"email":    "student1@iitm.ac.in",
		"password": "Password123!",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200 OK, got %d", w.Code)
	}

	var resp models.ApiResponse
	json.NewDecoder(w.Body).Decode(&resp)

	if !resp.Success {
		t.Fatalf("Expected success true, got false")
	}
}

func TestLoginInvalidPassword(t *testing.T) {
	r, _, _ := setupTestApp()

	payload := map[string]string{
		"email":    "student1@iitm.ac.in",
		"password": "WrongPassword",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected status 401 Unauthorized, got %d", w.Code)
	}
}

func TestRoleBasedAccessControl(t *testing.T) {
	r, _, cfg := setupTestApp()

	// Obtain student token
	studentUser := &models.User{ID: "00000000-0000-0000-0000-000000000001", Role: models.RoleStudent, Email: "student1@iitm.ac.in", Name: "Aravind"}
	token, err := generateJWT(studentUser, "10000000-0000-0000-0000-000000000001", "", cfg.JWTSecret)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	// Student accessing faculty endpoint (Should be 403 Forbidden)
	req := httptest.NewRequest("GET", "/api/faculty/courses", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("Expected status 403 Forbidden for cross-role access, got %d", w.Code)
	}
}

func TestAdminResetSeedProtected(t *testing.T) {
	r, _, cfg := setupTestApp()

	// 1. Unauthenticated request to /api/admin/reset-seed -> 401
	req1 := httptest.NewRequest("POST", "/api/admin/reset-seed", nil)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 Unauthorized for unauthenticated admin endpoint call, got %d", w1.Code)
	}

	// 2. Student token accessing /api/admin/reset-seed -> 403
	studentUser := &models.User{ID: "00000000-0000-0000-0000-000000000001", Role: models.RoleStudent}
	stdToken, _ := generateJWT(studentUser, "10000000-0000-0000-0000-000000000001", "", cfg.JWTSecret)

	req2 := httptest.NewRequest("POST", "/api/admin/reset-seed", nil)
	req2.Header.Set("Authorization", "Bearer "+stdToken)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusForbidden {
		t.Fatalf("Expected 403 Forbidden for student accessing admin endpoint, got %d", w2.Code)
	}
}

func TestStudentRegistrationAndGradeFlow(t *testing.T) {
	r, _, cfg := setupTestApp()

	// Student JWT
	studentUser := &models.User{ID: "00000000-0000-0000-0000-000000000001", Role: models.RoleStudent, Email: "student1@iitm.ac.in", Name: "Aravind"}
	stdToken, _ := generateJWT(studentUser, "10000000-0000-0000-0000-000000000001", "", cfg.JWTSecret)

	// Duplicate registration attempt for already registered course
	regReqBody, _ := json.Marshal(map[string]string{
		"course_offering_id": "50000000-0000-0000-0000-000000000001",
	})
	req := httptest.NewRequest("POST", "/api/student/registrations", bytes.NewBuffer(regReqBody))
	req.Header.Set("Authorization", "Bearer "+stdToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)
	if w.Code != http.StatusConflict {
		t.Fatalf("Expected 409 Conflict for duplicate registration, got %d", w.Code)
	}

	// Faculty Upload Grade
	facUser := &models.User{ID: "00000000-0000-0000-0000-000000000003", Role: models.RoleFaculty, Email: "faculty1@iitm.ac.in", Name: "Prof. Ramesh"}
	facToken, _ := generateJWT(facUser, "", "20000000-0000-0000-0000-000000000001", cfg.JWTSecret)

	gradeReqBody, _ := json.Marshal(map[string]string{
		"registration_id": "60000000-0000-0000-0000-000000000001",
		"grade":           "A+",
	})
	reqGrade := httptest.NewRequest("POST", "/api/faculty/courses/50000000-0000-0000-0000-000000000001/grades", bytes.NewBuffer(gradeReqBody))
	reqGrade.Header.Set("Authorization", "Bearer "+facToken)
	reqGrade.Header.Set("Content-Type", "application/json")
	wGrade := httptest.NewRecorder()

	r.ServeHTTP(wGrade, reqGrade)
	if wGrade.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for faculty grade upload, got %d", wGrade.Code)
	}

	// Publish Grades & verify email dispatch handling
	pubReq := httptest.NewRequest("POST", "/api/faculty/courses/50000000-0000-0000-0000-000000000001/publish-grades", nil)
	pubReq.Header.Set("Authorization", "Bearer "+facToken)
	wPub := httptest.NewRecorder()

	r.ServeHTTP(wPub, pubReq)
	if wPub.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for grade publication, got %d", wPub.Code)
	}
}

func TestEmailServiceDisabled(t *testing.T) {
	cfg := &config.Config{EnableEmail: false}
	emailSvc := services.NewEmailService(cfg)

	ok := emailSvc.SendGradeNotification("student1@iitm.ac.in", "Aravind", "CS3100", "Data Structures", "A+")
	if !ok {
		t.Fatalf("Expected true return when email is safely skipped, got false")
	}
}
