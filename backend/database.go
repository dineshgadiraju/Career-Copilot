package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func ConnectDB() {
	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		databaseURL = "postgres://postgres:welcome2ibm@localhost:5433/careercopilot?sslmode=disable"
	}

	var err error

	DB, err = pgxpool.New(
		context.Background(),
		databaseURL,
	)

	if err != nil {
		panic(err)
	}

	err = DB.Ping(context.Background())

	if err != nil {
		panic(err)
	}

	fmt.Println("✅ Connected to PostgreSQL")
}
