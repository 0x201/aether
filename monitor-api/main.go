package main

import (
	_ "monitor-api/docs"
	"os"

	"github.com/gofiber/fiber/v3"
	"github.com/yokeTH/gofiber-scalar/scalar/v3"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	app := fiber.New()

	cfg := scalar.Config{
		BasePath: "/",
		Path:     "/scalar",
		Theme:    scalar.ThemeKepler,
		Title:    "Monitor API Docs",
	}

	app.Get("/scalar/*", scalar.New(cfg))

	// Example route
	app.Get("/", func(c fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	app.Listen(":" + port)
}
