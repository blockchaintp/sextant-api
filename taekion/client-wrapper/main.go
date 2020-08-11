package main

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"
	"time"
)

func main() {
	SEXTANT_API_KEY := os.Getenv("SEXTANT_API_KEY")
	SEXTANT_API_URL := os.Getenv("SEXTANT_API_URL")
	BINARY_NAME := os.Getenv("BINARY_NAME")
	DEBUG := os.Getenv("DEBUG")

	if BINARY_NAME == "" {
		log.Fatalf("BINARY_NAME is required")
	}

	if SEXTANT_API_KEY == "" {
		log.Fatalf("SEXTANT_API_KEY is required")
	}

	if SEXTANT_API_URL == "" {
		log.Fatalf("SEXTANT_API_URL is required")
	}

	remote, err := url.Parse(SEXTANT_API_URL)
	if err != nil {
		panic(err)
	}

	args := os.Args[1:]

	director := func(req *http.Request) {
		req.URL.Scheme = remote.Scheme
		req.URL.Host = remote.Host
		req.URL.Path = fmt.Sprintf("%s%s", remote.Path, req.URL.Path)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", SEXTANT_API_KEY))
		if DEBUG != "" {
			log.Println(req.Method)
			log.Println(req.URL)
		}
	}

	proxy := &httputil.ReverseProxy{Director: director}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		proxy.ServeHTTP(w, r)
	})

	go func() {
		log.Fatal(http.ListenAndServe(":8008", nil))
	}()

	// TODO: work out how to know that the proxy server has been setup and is listening
	time.Sleep(time.Millisecond * 10)

	args = append(args, "--url", "http://127.0.0.1:8008")

	cmd := exec.Command(BINARY_NAME, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			os.Exit(exitError.ExitCode())
		}
	}
}
