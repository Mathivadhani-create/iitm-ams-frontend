package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/iitm-ams/backend/internal/models"
)

type contextKey string

const UserContextKey contextKey = "authenticatedUser"

type Claims struct {
	UserID    string          `json:"userId"`
	Role      models.UserRole `json:"role"`
	Email     string          `json:"email"`
	Name      string          `json:"name"`
	StudentID string          `json:"studentId,omitempty"`
	FacultyID string          `json:"facultyId,omitempty"`
	jwt.RegisteredClaims
}

func JWTAuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				respondError(w, http.StatusUnauthorized, "Authentication required. Missing Authorization header.")
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				respondError(w, http.StatusUnauthorized, "Invalid authorization header format. Expected 'Bearer <token>'.")
				return
			}

			tokenStr := parts[1]
			claims := &Claims{}

			token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
				return []byte(jwtSecret), nil
			})

			if err != nil || !token.Valid {
				respondError(w, http.StatusUnauthorized, "Invalid or expired JWT access token.")
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(requiredRole models.UserRole) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(*Claims)
			if !ok || claims == nil {
				respondError(w, http.StatusUnauthorized, "Unauthorized access.")
				return
			}

			if claims.Role != requiredRole && claims.Role != models.RoleAdmin {
				respondError(w, http.StatusForbidden, "Forbidden: Insufficient privileges for this endpoint.")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func GetUserClaims(r *http.Request) (*Claims, bool) {
	claims, ok := r.Context().Value(UserContextKey).(*Claims)
	return claims, ok
}

func respondError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(models.ApiResponse{
		Success: false,
		Message: message,
		Error:   message,
	})
}
