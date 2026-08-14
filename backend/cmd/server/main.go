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

	// ============================================================
	// GLOBAL CORS MIDDLEWARE
	// ============================================================
	corsMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			origin := req.Header.Get("Origin")

			// Allow the configured frontend origin.
			if cfg.CORSOrigin == "*" {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			} else if origin == cfg.CORSOrigin {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			}

			w.Header().Set("Vary", "Origin")
			w.Header().Set(
				"Access-Control-Allow-Methods",
				"GET, POST, PUT, PATCH, DELETE, OPTIONS",
			)
			w.Header().Set(
				"Access-Control-Allow-Headers",
				"Content-Type, Authorization",
			)
			w.Header().Set("Access-Control-Max-Age", "86400")

			// Handle CORS preflight before Gorilla Mux routing.
			if req.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, req)
		})
	}

	// IMPORTANT: actually apply the CORS middleware.
	r.Use(corsMiddleware)

	// Explicitly handle all CORS preflight requests.
	r.PathPrefix("/").Methods(http.MethodOptions).HandlerFunc(
		func(w http.ResponseWriter, req *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		},
	)

	// ============================================================
	// HEALTH CHECK
	// ============================================================
	r.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "ok",
			"system":    "IIT Madras Academic Management System (Golang Production Backend)",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	}).Methods(http.MethodGet)

	// ============================================================
	// PUBLIC AUTH ROUTES
	// ============================================================
	r.HandleFunc(
		"/api/auth/login",
		authH.Login,
	).Methods(http.MethodPost)

	r.HandleFunc(
		"/api/auth/register",
		authH.Register,
	).Methods(http.MethodPost)

	// ============================================================
	// ADMIN ROUTES
	// ============================================================
	adminSub := r.PathPrefix("/api/admin").Subrouter()

	adminSub.Use(
		middleware.JWTAuthMiddleware(cfg.JWTSecret),
	)
	adminSub.Use(
		middleware.RequireRole(models.RoleAdmin),
	)

	adminSub.HandleFunc(
		"/reset-seed",
		adminH.ResetSeed,
	).Methods(http.MethodPost)

	// ============================================================
	// AUTHENTICATED AUTH ROUTES
	// ============================================================
	authSub := r.PathPrefix("/api/auth").Subrouter()

	authSub.Use(
		middleware.JWTAuthMiddleware(cfg.JWTSecret),
	)

	authSub.HandleFunc(
		"/me",
		authH.Me,
	).Methods(http.MethodGet)

	// ============================================================
	// STUDENT ROUTES
	// ============================================================
	stdSub := r.PathPrefix("/api/student").Subrouter()

	stdSub.Use(
		middleware.JWTAuthMiddleware(cfg.JWTSecret),
	)
	stdSub.Use(
		middleware.RequireRole(models.RoleStudent),
	)

	stdSub.HandleFunc(
		"/profile",
		studentH.GetProfile,
	).Methods(http.MethodGet)

	stdSub.HandleFunc(
		"/courses",
		studentH.GetAvailableCourses,
	).Methods(http.MethodGet)

	stdSub.HandleFunc(
		"/registrations",
		studentH.GetRegistrations,
	).Methods(http.MethodGet)

	stdSub.HandleFunc(
		"/registrations",
		studentH.RegisterCourse,
	).Methods(http.MethodPost)

	stdSub.HandleFunc(
		"/registrations/{id}",
		studentH.DropCourse,
	).Methods(http.MethodDelete)

	stdSub.HandleFunc(
		"/grades",
		studentH.GetGrades,
	).Methods(http.MethodGet)

	stdSub.HandleFunc(
		"/notifications",
		studentH.GetNotifications,
	).Methods(http.MethodGet)

	stdSub.HandleFunc(
		"/notifications/{id}/read",
		studentH.MarkNotificationRead,
	).Methods(http.MethodPatch)

	// ============================================================
	// FACULTY ROUTES
	// ============================================================
	facSub := r.PathPrefix("/api/faculty").Subrouter()

	facSub.Use(
		middleware.JWTAuthMiddleware(cfg.JWTSecret),
	)
	facSub.Use(
		middleware.RequireRole(models.RoleFaculty),
	)

	facSub.HandleFunc(
		"/profile",
		facultyH.GetProfile,
	).Methods(http.MethodGet)

	facSub.HandleFunc(
		"/courses",
		facultyH.GetAssignedCourses,
	).Methods(http.MethodGet)

	facSub.HandleFunc(
		"/courses/{id}/students",
		facultyH.GetEnrolledStudents,
	).Methods(http.MethodGet)

	facSub.HandleFunc(
		"/courses/{id}/grades",
		facultyH.UploadGrade,
	).Methods(http.MethodPost)

	facSub.HandleFunc(
		"/grades/{id}",
		facultyH.UpdateGrade,
	).Methods(http.MethodPut)

	facSub.HandleFunc(
		"/courses/{id}/publish-grades",
		facultyH.PublishGrades,
	).Methods(http.MethodPost)

	facSub.HandleFunc(
		"/notifications",
		facultyH.GetNotifications,
	).Methods(http.MethodGet)

	// ============================================================
	// START SERVER
	// ============================================================
	port := cfg.Port

	if port == "" {
		port = "8080"
	}

	fmt.Printf(
		"[IITM AMS Go Backend] Server running on port %s...\n",
		port,
	)

	log.Fatal(
		http.ListenAndServe(":"+port, r),
	)
}
