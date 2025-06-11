// Import the Winston logging library
const winston = require("winston");

// Create a logger instance with configuration
const logger = winston.createLogger({
  // Set log level: 'debug' for development, 'info' for production
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  // Define how log messages should be formatted
  format: winston.format.combine(
    winston.format.timestamp(),              // Include a timestamp with each log
    winston.format.errors({ stack: true }),  // Include stack trace for errors
    winston.format.splat(),                  // Support string interpolation (%s, etc.)
    winston.format.json()                    // Format logs as JSON for better structure
  ),

  // Add default metadata to every log (useful for microservices)
  defaultMeta: { service: "media-service" },

  // Define where to send log messages (called "transports")
  transports: [
    // Console output transport (only during development)
    new winston.transports.Console({  
      format: winston.format.combine(
        winston.format.colorize(), // Add color to log levels (e.g., red for error)
        winston.format.simple()    // Simple formatting for readability in console
      )
    }),

    // File transport for only error-level logs (saved to error.log)
    new winston.transports.File({ filename: "error.log", level: "error" }),

    // File transport for all logs (saved to combined.log)
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Export the logger so it can be used throughout the project
module.exports = logger;
