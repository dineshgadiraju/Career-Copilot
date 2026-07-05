package main

import (
	"context"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client
var Ctx = context.Background()

func ConnectRedis() {
	redisAddr := os.Getenv("REDIS_ADDR")

	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	_, err := RedisClient.Ping(Ctx).Result()
	if err != nil {
		log.Println("Redis not connected:", err)
		return
	}

	log.Println("✅ Connected to Redis")
}
