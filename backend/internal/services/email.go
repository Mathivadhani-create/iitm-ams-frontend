package services

import (
	"fmt"
	"log"
	"net/smtp"

	"github.com/iitm-ams/backend/internal/config"
)

type EmailService struct {
	cfg *config.Config
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{cfg: cfg}
}

func (s *EmailService) SendGradeNotification(toEmail, studentName, courseCode, courseName, grade string) bool {
	subject := fmt.Sprintf("Grade Published: %s - %s", courseCode, courseName)
	body := fmt.Sprintf("Dear %s,\n\nYour grade for %s (%s) has been published: Grade %s.\n\nPlease log in to the IIT Madras Academic Management System portal to view your transcript.\n\nBest regards,\nAcademic Section, IIT Madras", studentName, courseName, courseCode, grade)

	if !s.cfg.EnableEmail {
		log.Printf("[Go EmailService] Email skipped for %s because email is disabled (ENABLE_EMAIL=false).", toEmail)
		log.Printf("[Go EmailService] Subject: %s", subject)
		return true
	}

	if s.cfg.SMTPHost == "" || s.cfg.SMTPUsername == "" {
		log.Printf("[Go EmailService] SMTP unconfigured. Email skipped safely.")
		return true
	}

	addr := fmt.Sprintf("%s:%d", s.cfg.SMTPHost, s.cfg.SMTPPort)
	auth := smtp.PlainAuth("", s.cfg.SMTPUsername, s.cfg.SMTPPassword, s.cfg.SMTPHost)

	from := s.cfg.SMTPFrom
	if from == "" {
		from = "noreply-ams@iitm.ac.in"
	}

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s", from, toEmail, subject, body)

	err := smtp.SendMail(addr, auth, from, []string{toEmail}, []byte(msg))
	if err != nil {
		log.Printf("[Go EmailService] Non-fatal error sending email to %s: %v", toEmail, err)
		return false
	}

	log.Printf("[Go EmailService] Email sent successfully to %s", toEmail)
	return true
}
