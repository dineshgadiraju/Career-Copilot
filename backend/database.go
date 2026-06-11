package main

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
)

func ConnectDB() {
	conn, err := pgx.Connect(
		context.Background(),
		"postgres://postgres:postgres@localhost:5432/careercopilot",
	)

	if err != nil {
		panic(err)
	}

	fmt.Println("✅ Connected to PostgreSQL")

	defer conn.Close(context.Background())
}
