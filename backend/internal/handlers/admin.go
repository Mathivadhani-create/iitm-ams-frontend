package handlers

import (
	"net/http"

	"github.com/iitm-ams/backend/internal/models"
	"github.com/iitm-ams/backend/internal/store"
)

type AdminHandler struct {
	store *store.Store
}

func NewAdminHandler(st *store.Store) *AdminHandler {
	return &AdminHandler{store: st}
}

func (h *AdminHandler) ResetSeed(w http.ResponseWriter, r *http.Request) {
	h.store.SeedInitialData()
	respondJSON(w, http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Database reset to initial seed data successfully.",
	})
}
