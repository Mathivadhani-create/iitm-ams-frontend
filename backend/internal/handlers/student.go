package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/iitm-ams/backend/internal/middleware"
	"github.com/iitm-ams/backend/internal/models"
	"github.com/iitm-ams/backend/internal/store"
)

type StudentHandler struct {
	store *store.Store
}

func NewStudentHandler(st *store.Store) *StudentHandler {
	return &StudentHandler{store: st}
}

func (h *StudentHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok || claims.StudentID == "" {
		st, err := h.store.GetStudentByUserID(claims.UserID)
		if err != nil {
			respondJSON(w, http.StatusNotFound, models.ApiResponse{Success: false, Message: "Student record not found."})
			return
		}
		respondJSON(w, http.StatusOK, models.ApiResponse{Success: true, Data: st})
		return
	}

	st, err := h.store.GetStudentByUserID(claims.UserID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, models.ApiResponse{Success: false, Message: "Student record not found."})
		return
	}

	respondJSON(w, http.StatusOK, models.ApiResponse{Success: true, Data: st})
}

func (h *StudentHandler) GetAvailableCourses(w http.ResponseWriter, r *http.Request) {
	offerings := h.store.GetAvailableCourseOfferings()
	respondJSON(w, http.StatusOK, models.ApiResponse{Success: true, Data: offerings})
}

func (h *StudentHandler) GetRegistrations(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	st, err := h.store.GetStudentByUserID(claims.UserID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, models.ApiResponse{Success: false, Message: "Student record not found."})
		return
	}

	regs := h.store.GetStudentRegistrations(st.ID)
	respondJSON(w, http.StatusOK, models.ApiResponse{Success: true, Data: regs})
}

type RegisterCourseRequest struct {
	CourseOfferingID string `json:"course_offering_id"`
}

func (h *StudentHandler) RegisterCourse(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	st, err := h.store.GetStudentByUserID(claims.UserID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, models.ApiResponse{Success: false, Message: "Student record not found."})
		return
	}

	var req RegisterCourseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.CourseOfferingID == "" {
		respondJSON(w, http.StatusBadRequest, models.ApiResponse{Success: false, Message: "course_offering_id is required."})
		return
	}

	reg, err := h.store.CreateRegistration(st.ID, req.CourseOfferingID)
	if err != nil {
		respondJSON(w, http.StatusConflict, models.ApiResponse{Success: false, Message: err.Error()})
		return
	}

	respondJSON(w, http.StatusCreated, models.ApiResponse{
		Success: true,
		Message: "Course registration successful.",
		Data:    reg,
	})
}

func (h *StudentHandler) DropCourse(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	st, err := h.store.GetStudentByUserID(claims.UserID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, models.ApiResponse{Success: false, Message: "Student record not found."})
		return
	}

	vars := mux.Vars(r)
	regID := vars["id"]

	if err := h.store.DropRegistration(st.ID, regID); err != nil {
		respondJSON(w, http.StatusBadRequest, models.ApiResponse{Success: false, Message: err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Course registration dropped successfully.",
	})
}

func (h *StudentHandler) GetGrades(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	st, err := h.store.GetStudentByUserID(claims.UserID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, models.ApiResponse{Success: false, Message: "Student record not found."})
		return
	}

	grades := h.store.GetStudentGrades(st.ID)

	var totalPoints float64
	var totalCredits int
	for _, g := range grades {
		if g.Grade != nil && g.CourseOffering != nil && g.CourseOffering.Course != nil {
			credits := g.CourseOffering.Course.Credits
			totalPoints += g.Grade.GradePoint * float64(credits)
			totalCredits += credits
		}
	}

	var gpa float64
	if totalCredits > 0 {
		gpa = totalPoints / float64(totalCredits)
	}

	respondJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"grades":        grades,
			"cgpa":          gpa,
			"total_credits": totalCredits,
		},
	})
}

func (h *StudentHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	notifs := h.store.GetUserNotifications(claims.UserID)
	respondJSON(w, http.StatusOK, models.ApiResponse{Success: true, Data: notifs})
}

func (h *StudentHandler) MarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserClaims(r)
	if !ok {
		respondJSON(w, http.StatusUnauthorized, models.ApiResponse{Success: false, Message: "Unauthorized."})
		return
	}

	vars := mux.Vars(r)
	notifID := vars["id"]

	if err := h.store.MarkNotificationRead(claims.UserID, notifID); err != nil {
		respondJSON(w, http.StatusBadRequest, models.ApiResponse{Success: false, Message: err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, models.ApiResponse{Success: true, Message: "Notification marked as read."})
}
