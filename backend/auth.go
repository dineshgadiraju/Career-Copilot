package main

import (
	"context"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

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

func Login(c *gin.Context) {

	var req LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request",
		})
		return
	}

	var user User

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT id, name, email, password_hash
		FROM users
		WHERE email = $1
		`,
		req.Email,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.PasswordHash,
	)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.Password),
	)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	token, err := GenerateToken(
		user.ID,
		user.Email,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
}
