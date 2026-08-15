package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/iitm-ams/backend/internal/config"
	"github.com/iitm-ams/backend/internal/middleware"
	"github.com/iitm-ams/backend/internal/models"
	"github.com/iitm-ams/backend/internal/store"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	store *store.Store
	cfg   *config.Config
}

func NewAuthHandler(st *store.Store, cfg *config.Config) *AuthHandler {
	return &AuthHandler{store: st, cfg: cfg}
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {

	// ============================================================
	// LOGIN DEBUG
	// ============================================================
	log.Printf(
		"[LOGIN DEBUG] Method=%s Content-Type=%q ContentLength=%d",
		r.Method,
		r.Header.Get("Content-Type"),
		r.ContentLength,
	)

	// Read and decode JSON request body.
	var req LoginRequest

	decoder := json.NewDecoder(r.Body)

	if err := decoder.Decode(&req); err != nil {

		log.Printf(
			"[LOGIN DEBUG] JSON decode failed: %v",
			err,
		)

		respondJSON(
			w,
			http.StatusBadRequest,
			models.ApiResponse{
				Success: false,
				Message: "Invalid request payload: " + err.Error(),
			},
		)
		return
	}

	// ============================================================
	// DEBUG DECODED VALUES
	// ============================================================
	log.Printf(
		"[LOGIN DEBUG] Email=%q PasswordLength=%d",
		req.Email,
		len(req.Password),
	)

	// Validate required fields.
	if req.Email == "" || req.Password == "" {
		log.Printf(
			"[LOGIN DEBUG] Missing email or password",
		)

		respondJSON(
			w,
			http.StatusBadRequest,
			models.ApiResponse{
				Success: false,
				Message: "Email and password are required.",
			},
		)
		return
	}

	// ============================================================
	// FIND USER
	// ============================================================
	user, err := h.store.GetUserByEmail(req.Email)

	if err != nil {
		log.Printf(
			"[LOGIN DEBUG] User lookup failed for %q: %v",
			req.Email,
			err,
		)

		respondJSON(
			w,
			http.StatusUnauthorized,
			models.ApiResponse{
				Success: false,
				Message: "Invalid credentials. Email not found.",
			},
		)
		return
	}

	log.Printf(
		"[LOGIN DEBUG] User found: ID=%s Role=%s",
		user.ID,
		user.Role,
	)

	// ============================================================
	// CHECK PASSWORD
	// ============================================================
	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.Password),
	); err != nil {

		log.Printf(
			"[LOGIN DEBUG] Password verification failed for %q: %v",
			req.Email,
			err,
		)

		respondJSON(
			w,
			http.StatusUnauthorized,
			models.ApiResponse{
				Success: false,
				Message: "Invalid credentials. Password incorrect.",
			},
		)
		return
	}

	log.Printf(
		"[LOGIN DEBUG] Password verification successful for %q",
		req.Email,
	)

	// ============================================================
	// GET STUDENT / FACULTY PROFILE ID
	// ============================================================
	var studentID, facultyID string

	if user.Role == models.RoleStudent {

		if st, err := h.store.GetStudentByUserID(user.ID); err == nil {
			studentID = st.ID

			log.Printf(
				"[LOGIN DEBUG] Student profile found: %s",
				studentID,
			)
		} else {
			log.Printf(
				"[LOGIN DEBUG] Student profile lookup failed: %v",
				err,
			)
		}

	} else if user.Role == models.RoleFaculty {

		if f, err := h.store.GetFacultyByUserID(user.ID); err == nil {
			facultyID = f.ID

			log.Printf(
				"[LOGIN DEBUG] Faculty profile found: %s",
				facultyID,
			)
		} else {
			log.Printf(
				"[LOGIN DEBUG] Faculty profile lookup failed: %v",
				err,
			)
		}
	}

	// ============================================================
	// GENERATE JWT
	// ============================================================
	tokenStr, err := generateJWT(
		user,
		studentID,
		facultyID,
		h.cfg.JWTSecret,
	)

	if err != nil {

		log.Printf(
			"[LOGIN DEBUG] JWT generation failed: %v",
			err,
		)

		respondJSON(
			w,
			http.StatusInternalServerError,
			models.ApiResponse{
				Success: false,
				Message: "Failed to issue token.",
			},
		)
		return
	}

	log.Printf(
		"[LOGIN DEBUG] Login successful for %q",
		req.Email,
	)

	respondJSON(
		w,
		http.StatusOK,
		models.ApiResponse{
			Success: true,
			Message: "Login successful.",
			Data: map[string]interface{}{
				"token": tokenStr,
				"user": map[string]interface{}{
					"id":        user.ID,
					"name":      user.Name,
					"email":     user.Email,
					"role":      user.Role,
					"studentId": studentID,
					"facultyId": facultyID,
				},
			},
		},
	)
}

type RegisterRequest struct {
	Name       string          `json:"name"`
	Email      string          `json:"email"`
	Password   string          `json:"password"`
	Role       models.UserRole `json:"role"`
	RollNumber string          `json:"roll_number,omitempty"`
	Department string          `json:"department,omitempty"`
	Program    string          `json:"program,omitempty"`
	Year       int             `json:"year,omitempty"`
	EmployeeID string          `json:"employee_id,omitempty"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {

	var req RegisterRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {

		respondJSON(
			w,
			http.StatusBadRequest,
			models.ApiResponse{
				Success: false,
				Message: "Invalid request payload: " + err.Error(),
			},
		)
		return
	}

	if req.Name == "" || req.Email == "" || req.Password == "" {

		respondJSON(
			w,
			http.StatusBadRequest,
			models.ApiResponse{
				Success: false,
				Message: "Name, email, and password are required.",
			},
		)
		return
	}

	hash, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)

	if err != nil {

		respondJSON(
			w,
			http.StatusInternalServerError,
			models.ApiResponse{
				Success: false,
				Message: "Failed to encrypt password.",
			},
		)
		return
	}

	user := &models.User{
		ID:           "u-" + uuid.New().String()[:8],
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         req.Role,
	}

	if err := h.store.CreateUser(user); err != nil {

		respondJSON(
			w,
			http.StatusConflict,
			models.ApiResponse{
				Success: false,
				Message: err.Error(),
			},
		)
		return
	}

	var studentID, facultyID string

	if req.Role == models.RoleStudent {

		student := &models.Student{
			ID:         "std-" + uuid.New().String()[:8],
			UserID:     user.ID,
			RollNumber: req.RollNumber,
			Department: req.Department,
			Program:    req.Program,
			Year:       req.Year,
			User:       user,
		}

		_ = h.store.CreateStudent(student)

		studentID = student.ID
	}

	tokenStr, _ := generateJWT(
		user,
		studentID,
		facultyID,
		h.cfg.JWTSecret,
	)

	respondJSON(
		w,
		http.StatusCreated,
		models.ApiResponse{
			Success: true,
			Message: "User account created successfully.",
			Data: map[string]interface{}{
				"token": tokenStr,
				"user": map[string]interface{}{
					"id":        user.ID,
					"name":      user.Name,
					"email":     user.Email,
					"role":      user.Role,
					"studentId": studentID,
				},
			},
		},
	)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {

	claims, ok := middleware.GetUserClaims(r)

	if !ok {
		respondJSON(
			w,
			http.StatusUnauthorized,
			models.ApiResponse{
				Success: false,
				Message: "Unauthorized.",
			},
		)
		return
	}

	user, err := h.store.GetUserByID(claims.UserID)

	if err != nil {
		respondJSON(
			w,
			http.StatusNotFound,
			models.ApiResponse{
				Success: false,
				Message: "User profile not found.",
			},
		)
		return
	}

	data := map[string]interface{}{
		"id":        user.ID,
		"name":      user.Name,
		"email":     user.Email,
		"role":      user.Role,
		"studentId": claims.StudentID,
		"facultyId": claims.FacultyID,
	}

	if user.Role == models.RoleStudent {

		student, err := h.store.GetStudentByUserID(user.ID)

		if err == nil && student != nil {
			data["student"] = student
		}
	}

	if user.Role == models.RoleFaculty {

		faculty, err := h.store.GetFacultyByUserID(user.ID)

		if err == nil && faculty != nil {
			data["faculty"] = faculty
		}
	}

	respondJSON(
		w,
		http.StatusOK,
		models.ApiResponse{
			Success: true,
			Data:    data,
		},
	)
}

func generateJWT(
	u *models.User,
	studentID,
	facultyID,
	jwtSecret string,
) (string, error) {

	claims := middleware.Claims{
		UserID:    u.ID,
		Role:      u.Role,
		Email:     u.Email,
		Name:      u.Name,
		StudentID: studentID,
		FacultyID: facultyID,
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		claims,
	)

	return token.SignedString([]byte(jwtSecret))
}

func respondJSON(
	w http.ResponseWriter,
	status int,
	resp models.ApiResponse,
) {
	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	w.WriteHeader(status)

	_ = json.NewEncoder(w).Encode(resp)
}
