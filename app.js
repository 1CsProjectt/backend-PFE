


// Create an HTTP server
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5000",
  "http://192.168.206.209:3000", 
  "http://192.168.170.167:3000",
  "https://backend-pfe-1.onrender.com",
  "https://98cc-154-246-81-2.ngrok-free.app",
  "https://6072-105-235-138-57.ngrok-free.app/api/v1" ,
  "https://9625-105-235-138-133.ngrok-free.app/api/v1"

]; 


const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow requests without origin (e.g., from internal server)
      
      // Check if the origin is in the allowedOrigins list
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from ${origin}`;
        return callback(new Error(msg), false); // Deny the connection
      }
      
      // Allow the connection
      return callback(null, true);
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true, // Allow cookies and credentials
  },
});


app.set("socketio", io);

// Handle connection
io.on("connection", (socket) => {
  console.log(`⚡ New client connected: ${socket.id}`);

  socket.on("join", (userId) => {
    socket.join(userId); // Join private room
    console.log(`User with ID ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log(`⚡ Client disconnected: ${socket.id}`);
  });
});


// const dotenv = require("dotenv");
// dotenv.config();

// const express = require("express");
// const app = require("./index.js");
// const morgan = require("morgan");
// const cors = require("cors");


// Middlewares
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev")); 
}


const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => 
    console.log(`🚀 Server running on port ${PORT}`)
);

// Handle unexpected errors
process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION! Shutting down...", err);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION! Shutting down...", err);
    server.close(() => process.exit(1));
});
