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

app.use(helmet());  
app.use(cors({ origin: "*", methods: "GET,POST,PUT,DELETE" }));  
app.use(compression());
app.use(express.json());
app.use('/uploads', express.static('uploads', { maxAge: '1d' }));
app.use('/photos', express.static(path.join(process.cwd(), 'photos')));



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

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pfe', pfeRoutes);
app.use("/api/v1/session", eventRoutes);
app.use("/api/v1/student", studentroute);
app.use("/api/v1/groups", groupRoutes);
app.use("/api/v1/invitation",invitationRoutes);
app.use("/api/v1/jointeam",jointeamRoutes);




// Handle unmatched routes
app.all('*', (req, res, next) => { 
    next(new appError(`Can't find ${req.originalUrl} on this server`, 404));



});



// Global error handler
app.use(errorhandler);


export default app;

//module.exports = app;
