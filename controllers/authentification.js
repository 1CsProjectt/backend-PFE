import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { promisify } from "util";
import User from "../models/UserModel.js";
import appError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import dotenv from "dotenv";
import Student from "../models/studenModel.js";

dotenv.config();

const frontUrl = process.env.FRONT_URL;
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "168h" });

export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new appError("Please provide email and password", 400));
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new appError("Incorrect email or password", 401));
    }

    let student;
    if(user.role==='student'){
         student= await Student.findByPk(user.id);
        if(!student){
            return next(new appError('student not found',403))
        };
        console.log('Student object:', student);
    }

    const token = signToken(user.id);
    
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 168 * 60 * 60 * 1000,
    });

    res.status(200).json({ status: "success", user: { id: user.id, email: user.email, role: user.role , team_id: student ? student.team_id : null,} });
});


export const forgotPassword = catchAsync(async (req, res, next) => {

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return next(new appError("User not found", 404));

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + parseInt(process.env.RESET_TOKEN_EXPIRY);
    await user.save();

    const resetUrl = `https://backend-pfe-1.onrender.com/api/v1/auth/reset-password/${resetToken}`;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Password Reset Request",
        text: `Click the link to reset your password: ${resetUrl}`
    });

    res.json({ message: "Reset link sent to email" });
});

export const validateResetToken = catchAsync(async (req, res, next) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (!user) return next(new appError("User not found", 404));
        res.json({ message: "Valid token. Proceed with password reset." });
    } catch (error) {
        return next(new appError("Invalid or expired token", 400));
    }
});

export const resetPassword = catchAsync(async (req, res, next) => {
    const { newPassword } = req.body;
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return next(new appError("User not found", 404));

    await user.update({ 
        password: await bcrypt.hash(newPassword, 10),
        resetToken: null,
        resetTokenExpiry: null,
        passwordChangedAt: new Date()
    });
    

    res.json({ message: "Password successfully reset" });
});



// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
// const { promisify } = require("util");
// const User = require("../models/User.js");
// const appError = require("../utils/appError.js");
// const catchAsync = require("../utils/catchAsync.js");
// require("dotenv").config();

// const frontUrl = process.env.FRONT_URL;
// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "168h" });

// exports.login = catchAsync(async (req, res, next) => {
//     const { email, password } = req.body;
//     if (!email || !password) {
//         return next(new appError("Please provide email and password", 400));
//     }

//     const user = await User.findOne({ where: { email } });
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//         return next(new appError("Incorrect email or password", 401));
//     }

//     const token = signToken(user.id);
//     res.cookie("jwt", token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "Strict",
//         maxAge: 168 * 60 * 60 * 1000,
//     });

//     res.status(200).json({ status: "success", user: { id: user.id, email: user.email, role: user.role } });
// });

// exports.forgotPassword = catchAsync(async (req, res, next) => {
//     const { email } = req.body;
//     const user = await User.findOne({ where: { email } });
//     if (!user) return next(new appError("User not found", 404));

//     const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
//     user.resetToken = resetToken;
//     user.resetTokenExpiry = Date.now() + parseInt(process.env.RESET_TOKEN_EXPIRY);
//     await user.save();

//     const resetUrl = `${frontUrl}/auth/reset-password/${resetToken}`;
//     await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: user.email,
//         subject: "Password Reset Request",
//         text: `Click the link to reset your password: ${resetUrl}`
//     });

//     res.json({ message: "Reset link sent to email" });
// });

// exports.validateResetToken = catchAsync(async (req, res, next) => {
//     try {
//         const { token } = req.params;
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findByPk(decoded.id);
//         if (!user) return next(new appError("User not found", 404));
//         res.json({ message: "Valid token. Proceed with password reset." });
//     } catch (error) {
//         return next(new appError("Invalid or expired token", 400));
//     }
// });

// exports.resetPassword = catchAsync(async (req, res, next) => {
//     const { newPassword } = req.body;
//     const { token } = req.params;

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findByPk(decoded.id);
//     if (!user) return next(new appError("User not found", 404));

//     user.password = await bcrypt.hash(newPassword, 10);
//     user.resetToken = null;
//     user.resetTokenExpiry = null;
//     await user.save();

//     res.json({ message: "Password successfully reset" });
// });