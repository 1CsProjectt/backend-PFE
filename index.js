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
import jointeamRoutes from './Routes/jointeamroute.js';
import invitationRoutes from './Routes/invitationRoute.js'
import './models/associateModels.js';
import cookieParser from 'cookie-parser';
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import path from "path";
import session from "express-session";
import mime from 'mime-types';
// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const compression = require("compression");
// const morgan = require("morgan");
// const rateLimit = require("express-rate-limit");
// const appError = require("./utils/appError.js");
// const { errorhandler } = require("./controllers/errController.js");
// const studentroute = require("./Routes/studentRoute.js");
// const userRoutes = require("./Routes/userRoute.js");
// const authRoutes = require("./Routes/authRoute.js");
// const pfeRoutes = require("./Routes/pfeRoute.js");
// const eventRoutes = require("./Routes/eventRoute.js");
// const groupRoutes = require("./Routes/groupRoute.js");
// require("./models/associateModels.js");
// const cookieParser = require("cookie-parser");




const app = express();

app.use(hpp());

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

app.use(cookieParser());

// Consolidated CORS Configuration
const allowedOrigins = [
  "http://localhost:3000", 
  "http://192.168.170.167:3000",
  "https://8cb9-154-247-119-87.ngrok-free.app",
  "https://180b-154-247-119-87.ngrok-free.app",
  "https://98cc-154-246-81-2.ngrok-free.app/api/v1" ,
  "https://180b-154-247-119-87.ngrok-free.app/api/v1"
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
app.use('/uploads',  express.static(path.join(process.cwd(), 'photos'),{
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', mime.getType(path));
  }
}));
app.use('/photos', express.static(path.join(process.cwd(), 'photos'), {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', mime.getType(path));
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
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
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pfe', pfeRoutes);
app.use("/api/v1/session", eventRoutes);
app.use("/api/v1/student", studentroute);
app.use("/api/v1/teams", groupRoutes);
app.use("/api/v1/invitation",invitationRoutes);
app.use("/api/v1/jointeam",jointeamRoutes);


app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Welcome to the PFE Web Application API!",
    });
});

app.get('/test-mime', (req, res) => {
  const testCases = {
    'test.jpg': mime.lookup('./photos/photo-1743261336544-673918170.jpg'),
    'document.pdf': mime.lookup('document.pdf'),
    'unknown.xyz': mime.lookup('unknown.xyz')
  };
  
  res.json({
    status: 'MIME test successful',
    results: testCases
  });
});


// Handle unmatched routes
app.all('*', (req, res, next) => { 
    next(new appError(`Can't find ${req.originalUrl} on this server`, 404));



});



// Global error handler
app.use(errorhandler);


export default app;

//module.exports = app;
