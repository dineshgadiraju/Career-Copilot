package main

import (
	"context"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Register(c *gin.Context) {

	var req RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println("JSON ERROR:", err)

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request",
		})
		return
	}

	fmt.Println("Attempting to register:", req.Email)

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		fmt.Println("BCRYPT ERROR:", err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to hash password",
		})
		return
	}

	_, err = DB.Exec(
		context.Background(),
		`
		INSERT INTO users(name, email, password_hash)
		VALUES($1, $2, $3)
		`,
		req.Name,
		req.Email,
		string(hashedPassword),
	)

	if err != nil {
		fmt.Println("DATABASE ERROR:", err)

		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	fmt.Println("User registered successfully:", req.Email)

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
	})
}
