package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/iitm-ams/backend/internal/middleware"
	"github.com/iitm-ams/backend/internal/models"
	"github.com/iitm-ams/backend/internal/services"
	"github.com/iitm-ams/backend/internal/store"
)

type FacultyHandler struct {
	store        *store.Store
	emailService *services.EmailService
}

func NewFacultyHandler(st *store.Store, emailService *services.EmailService) *FacultyHandler {
	return &FacultyHandler{store: st, emailService: emailService}
}

func (h *FacultyHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	fac, err := h.store.GetFacultyByUserID(claims.UserID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, models.ApiResponse{Success: false, Message: "Faculty record not found."})
		return
	}

	respondJSON(w, http.StatusOK, models.ApiResponse{Success: true, Data: fac})
}

func (h *FacultyHandler) GetAssignedCourses(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	fac, err := h.store.GetFacultyByUserID(claims.UserID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, models.ApiResponse{Success: false, Message: "Faculty record not found."})
		return
	}

	courses := h.store.GetFacultyOfferings(fac.ID)
	respondJSON(w, http.StatusOK, models.ApiResponse{Success: true, Data: courses})
}

func (h *FacultyHandler) GetEnrolledStudents(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	fac, err := h.store.GetFacultyByUserID(claims.UserID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, models.ApiResponse{Success: false, Message: "Faculty record not found."})
		return
	}

	vars := mux.Vars(r)
	offeringID := vars["id"]

	students, err := h.store.GetEnrolledStudentsForOffering(fac.ID, offeringID)
	if err != nil {
		respondJSON(w, http.StatusForbidden, models.ApiResponse{Success: false, Message: err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, models.ApiResponse{Success: true, Data: students})
}

type UploadGradeRequest struct {
	RegistrationID string             `json:"registration_id"`
	Grade          models.GradeLetter `json:"grade"`
}

func (h *FacultyHandler) UploadGrade(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	fac, err := h.store.GetFacultyByUserID(claims.UserID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, models.ApiResponse{Success: false, Message: "Faculty record not found."})
		return
	}

	var req UploadGradeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.RegistrationID == "" || req.Grade == "" {
		respondJSON(w, http.StatusBadRequest, models.ApiResponse{Success: false, Message: "registration_id and grade are required."})
		return
	}

	grade, err := h.store.SaveGrade(fac.ID, req.RegistrationID, req.Grade)
	if err != nil {
		respondJSON(w, http.StatusUnprocessableEntity, models.ApiResponse{Success: false, Message: err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Grade saved successfully.",
		Data:    grade,
	})
}

func (h *FacultyHandler) UpdateGrade(w http.ResponseWriter, r *http.Request) {
	// Re-uses UploadGrade handler logic safely
	h.UploadGrade(w, r)
}

func (h *FacultyHandler) PublishGrades(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	fac, err := h.store.GetFacultyByUserID(claims.UserID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, models.ApiResponse{Success: false, Message: "Faculty record not found."})
		return
	}

	vars := mux.Vars(r)
	offeringID := vars["id"]

	students, co, err := h.store.PublishGrades(fac.ID, offeringID)
	if err != nil {
		respondJSON(w, http.StatusForbidden, models.ApiResponse{Success: false, Message: err.Error()})
		return
	}

	// Dispatch non-blocking emails (will log and skip safely if ENABLE_EMAIL=false)
	dispatched := 0
	for _, st := range students {
		if st.User != nil {
			h.emailService.SendGradeNotification(st.User.Email, st.User.Name, co.Course.CourseCode, co.Course.CourseName, "A+")
			dispatched++
		}
	}

	respondJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: fmt.Sprintf("Successfully published grades for %d students. Notifications sent.", len(students)),
		Data: map[string]interface{}{
			"published_count":   len(students),
			"emails_dispatched": dispatched,
		},
	})
}

func (h *FacultyHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	notifs := h.store.GetUserNotifications(claims.UserID)
	respondJSON(w, http.StatusOK, models.ApiResponse{Success: true, Data: notifs})
}
