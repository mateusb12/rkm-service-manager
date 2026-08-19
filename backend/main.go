package main

import (
	"log"
	"os"
)

func main() {
	server, err := NewAuthServer()
	if err != nil {
		log.Fatal(err)
	}
	defer server.db.Close()

	port := env("PORT", "8787")
	log.Printf("RKM backend listening on :%s", port)
	if err := server.httpServer().ListenAndServe(); err != nil && err.Error() != "http: Server closed" {
		panic(err)
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
