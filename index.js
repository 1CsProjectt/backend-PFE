import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import appError from "./utils/appError.js";
import { errorhandler } from "./controllers/errController.js";
import studentroute from "./Routes/studentRoute.js";
import userRoutes from "./Routes/userRoute.js";
import authRoutes from "./Routes/authRoute.js";
import pfeRoutes from "./Routes/pfeRoute.js";
import eventRoutes from "./Routes/eventRoute.js";
import groupRoutes from "./Routes/groupRoute.js";
import notificationRoute from "./Routes/notificationRoute.js";
import jointeamRoutes from './Routes/jointeamroute.js';
import invitationRoutes from './Routes/invitationRoute.js'
import './models/associateModels.js';
import cookieParser from 'cookie-parser';
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import path from "path";
import session from "express-session";
import mime from 'mime';
import swaggerUi from 'swagger-ui-express';
import {swaggerSpec} from './config/wsagger.js';
import dotenv from "dotenv";
dotenv.config(); 
import { Server } from "socket.io";
import http from "http"; 

import sequelize from "./config/database.js";
import User from "./models/UserModel.js"; 
import PFE from "./models/PFEmodel.js";
import Event from "./models/eventModel.js";
import Student from "./models/studenModel.js";
import teacher from "./models/teacherModel.js";
import Extern from "./models/externModel.js";
import Admin from "./models/adminModel.js";
import JoinRequest from "./models/jointeamModel.js";
import invitation from "./models/invitationModel.js";
import preflistroute from './Routes/preflistRoute.js'
import meetingsroute from './Routes/meetingsRoute.js'
import { getCurrentSession } from "./controllers/eventcontroller.js";
import { protect } from "./middlewares/authmiddleware.js";
import { injectCurrentSession } from "./middlewares/injectCurrentSession.js";
import autosoutroute from './Routes/SoutenanceAuthorizationRoute.js'
import SoutenanceAuthorization from "./models/autsoutModel.js";
import Soutenance from "./models/soutModel.js";
import soutnanceRoute from './Routes/soutnanceRoute.js'

(async () => {
  try {
    await sequelize.sync({  alter: true }); 
    console.log("✅ Database synced!");
    
  } catch (error) {
    console.error("❌ Sync error:", error); 
  }
  // } finally {
  //   await sequelize.close(); // Close the database connection
  // }
})();





const app = express();

app.use(hpp());

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

app.use(cookieParser());

app.set('trust proxy', 1);


// Consolidated CORS Configuration
const allowedOrigins = [ 

  "http://localhost:5000",
  "http://192.168.206.209:3000", 
  "http://192.168.170.167:3000",
  "https://backend-pfe-1.onrender.com",
  "https://backend-pfe-1.onrender.com/api/v1",
  "https://6072-105-235-138-57.ngrok-free.app/api/v1" ,
  "https://9625-105-235-138-133.ngrok-free.app/api/v1",
  "https://frontend-k4d0.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); 
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from ${origin}`;
      return callback(new Error(msg), false); // Deny the connection
    }
    return callback(null, true); // Allow the connection
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  exposedHeaders: ["set-cookie"], // Expose the "set-cookie" header for client-side cookies
}));

// For OPTIONS requests
app.options('*', cors());
 
  app.use(express.json());
app.use(helmet());  
app.use(compression());
app.use('/uploads',  express.static(path.join(process.cwd(), 'uploads'),{
  setHeaders: (res, path) => {
    res.setHeader('Content-Type', mime.getType(path))
  }
}));
app.use('/photos', express.static(path.join(process.cwd(), 'photos'), {
  setHeaders: (res, path) => {
    res.setHeader('Content-Type', mime.getType(path));
    res.setHeader('Cache-Control', 'public, max-age=31536000'); 
  }
}));





if (process.env.NODE_ENV === 'development') {
    app.use(morgan("dev"));
}

app.set('trust proxy', 1);
 
// Rate Limiting (Prevent API abuse)
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: "Too many requests, please try again later."
});


app.use('/api', limiter);
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production", 
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
}));

 
  

// Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1/auth', authRoutes);

app.use(protect,getCurrentSession);
app.use(injectCurrentSession);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/pfe', pfeRoutes);
app.use("/api/v1/session", eventRoutes);
app.use("/api/v1/student", studentroute);
app.use("/api/v1/teams", groupRoutes);
app.use("/api/v1/invitation",invitationRoutes);
app.use("/api/v1/jointeam",jointeamRoutes);
app.use("/api/v1/preflist",preflistroute);
app.use("/api/v1/mettings",meetingsroute);
app.use("/api/v1/notification",notificationRoute);
app.use("/api/v1/autsout",autosoutroute);
app.use("/api/v1/soutenances",soutnanceRoute);




app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Welcome to the PFE Web Application API!",
    });
});



app.get('/test-mime', (req, res) => {
  const images = [
    'https://backend-pfe-1.onrender.com/photos/photo-1744308138691-713144865.jpg', 
    'https://backend-pfe-1.onrender.com/photos/photo-1743709159069-467003800.jpg', 
  ];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>MIME Test</title>
        <style>
          body { font-family: sans-serif; text-align: center; }
          img { margin: 20px; max-width: 300px; height: auto; border: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <h1>MIME Test: Displaying Photos</h1>
        ${images
          .map(
            (src) => `<div><img src="${src}" alt="${path.basename(src)}"/></div>`
          )
          .join('')}
      </body>
    </html>
  `;

  res.send(html);
});



// Handle unmatched routes
app.all('*', (req, res, next) => { 
    next(new appError(`Can't find ${req.originalUrl} on this server`, 404));
});



// Global error handler
app.use(errorhandler);

const server = http.createServer(app);
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
    credentials: true, 
  },
});


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


const PORT = process.env.PORT || 7000;
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


import './controllers/scheduler.js'

export default app;

//module.exports = app;
