package main

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
)

var DB *pgx.Conn

func ConnectDB() {
	var err error

	DB, err = pgx.Connect(
		context.Background(),
		"postgres://postgres:welcome2ibm@localhost:5433/careercopilot?sslmode=disable",
	)

	if err != nil {
		panic(err)
	}

	fmt.Println("✅ Connected to PostgreSQL")

}
