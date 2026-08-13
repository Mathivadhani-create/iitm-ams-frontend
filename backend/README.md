# IIT Madras Academic Management System - Go Backend

This repository (`IITM-AMS-backend`) contains the production Go (Golang) REST API for the **IIT Madras Academic Management System**.

## Stack
- Go 1.22
- Gorilla Mux Router
- PostgreSQL Database
- JWT Authentication (`golang-jwt/jwt`)
- Password Hashing (`golang.org/x/crypto/bcrypt`)
- SMTP Email Service (`net/smtp`)

## Local Run
```bash
cp .env.example .env
go run cmd/server/main.go
```

## Docker Build
```bash
docker build -t iitm-ams-backend .
docker run -p 8080:8080 iitm-ams-backend
```
