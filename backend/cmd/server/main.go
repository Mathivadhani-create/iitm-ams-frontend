package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/iitm-ams/backend/internal/config"
	"github.com/iitm-ams/backend/internal/database"
	"github.com/iitm-ams/backend/internal/handlers"
	"github.com/iitm-ams/backend/internal/middleware"
	"github.com/iitm-ams/backend/internal/models"
	"github.com/iitm-ams/backend/internal/services"
	"github.com/iitm-ams/backend/internal/store"
)

func main() {
	cfg := config.LoadConfig()

	if cfg.DatabaseURL == "" {
		log.Fatalf("[FATAL] DATABASE_URL environment variable is required for production Go backend.")
	}

	dbConn, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[FATAL] Failed to connect to PostgreSQL database: %v", err)
	}
	defer dbConn.Close()
	log.Println("[Go Server] Connected to PostgreSQL database successfully.")

	st := store.NewStore(dbConn.Conn)
	emailSvc := services.NewEmailService(cfg)

	authH := handlers.NewAuthHandler(st, cfg)
	studentH := handlers.NewStudentHandler(st)
	facultyH := handlers.NewFacultyHandler(st, emailSvc)
	adminH := handlers.NewAdminHandler(st)

	r := mux.NewRouter()

	// Global CORS Middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", cfg.CORSOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	// Public Routes
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "ok",
			"system":    "IIT Madras Academic Management System (Golang Production Backend)",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	}).Methods("GET")

	r.HandleFunc("/api/auth/login", authH.Login).Methods("POST")
	r.HandleFunc("/api/auth/register", authH.Register).Methods("POST")

	// Protected Admin Subrouter
	adminSub := r.PathPrefix("/api/admin").Subrouter()
	adminSub.Use(middleware.JWTAuthMiddleware(cfg.JWTSecret))
	adminSub.Use(middleware.RequireRole(models.RoleAdmin))
	adminSub.HandleFunc("/reset-seed", adminH.ResetSeed).Methods("POST")

	// Protected Auth Routes
	authSub := r.PathPrefix("/api/auth").Subrouter()
	authSub.Use(middleware.JWTAuthMiddleware(cfg.JWTSecret))
	authSub.HandleFunc("/me", authH.Me).Methods("GET")

	// Student Protected Subrouter
	stdSub := r.PathPrefix("/api/student").Subrouter()
	stdSub.Use(middleware.JWTAuthMiddleware(cfg.JWTSecret))
	stdSub.Use(middleware.RequireRole(models.RoleStudent))

	stdSub.HandleFunc("/profile", studentH.GetProfile).Methods("GET")
	stdSub.HandleFunc("/courses", studentH.GetAvailableCourses).Methods("GET")
	stdSub.HandleFunc("/registrations", studentH.GetRegistrations).Methods("GET")
	stdSub.HandleFunc("/registrations", studentH.RegisterCourse).Methods("POST")
	stdSub.HandleFunc("/registrations/{id}", studentH.DropCourse).Methods("DELETE")
	stdSub.HandleFunc("/grades", studentH.GetGrades).Methods("GET")
	stdSub.HandleFunc("/notifications", studentH.GetNotifications).Methods("GET")
	stdSub.HandleFunc("/notifications/{id}/read", studentH.MarkNotificationRead).Methods("PATCH")

	// Faculty Protected Subrouter
	facSub := r.PathPrefix("/api/faculty").Subrouter()
	facSub.Use(middleware.JWTAuthMiddleware(cfg.JWTSecret))
	facSub.Use(middleware.RequireRole(models.RoleFaculty))

	facSub.HandleFunc("/profile", facultyH.GetProfile).Methods("GET")
	facSub.HandleFunc("/courses", facultyH.GetAssignedCourses).Methods("GET")
	facSub.HandleFunc("/courses/{id}/students", facultyH.GetEnrolledStudents).Methods("GET")
	facSub.HandleFunc("/courses/{id}/grades", facultyH.UploadGrade).Methods("POST")
	facSub.HandleFunc("/grades/{id}", facultyH.UpdateGrade).Methods("PUT")
	facSub.HandleFunc("/courses/{id}/publish-grades", facultyH.PublishGrades).Methods("POST")
	facSub.HandleFunc("/notifications", facultyH.GetNotifications).Methods("GET")

	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	fmt.Printf("[IITM AMS Go Backend] Server running on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
