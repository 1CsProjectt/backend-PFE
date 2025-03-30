import dotenv from "dotenv";
dotenv.config(); 

import express from "express";
import app from "./index.js";
import morgan from "morgan";
import cors from "cors";
import { Server } from "socket.io";
import http from "http"; 


// Create an HTTP server
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:3800",
  "http://192.168.212.160:3000",
  "http://192.168.212.160:3000/pfe"
];

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, 
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true, 
  },
});


// Store io instance in app
app.set("socketio", io);

// Handle connection
io.on("connection", (socket) => {
  console.log(`⚡ New client connected: ${socket.id}`);

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
