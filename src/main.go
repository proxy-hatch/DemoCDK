package main

import "net/http"

import (
	"log"
)

func main() {
	// Set up the HTTP handler function
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Set the content type to plain text
		w.Header().Set("Content-Type", "text/plain")

		// Write the response code explicitly
		w.WriteHeader(http.StatusOK)

		// Write the response body
		w.Write([]byte("Health check successful"))

		log.Println("Successfully responded request at /")
	})

	// Configure the server to listen on port 8080
	log.Println("Server starting on port 8080...")

	// Start the server and log if there are any errors
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
