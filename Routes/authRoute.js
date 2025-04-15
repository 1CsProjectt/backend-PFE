import express from 'express';
import { login } from '../controllers/authentification.js';
import { forgotPassword,validateResetToken,resetPassword ,getMe} from '../controllers/authentification.js';
// const express = require('express');
// const { login } = require('../controllers/authentification.js');


const router = express.Router();

router.post('/login', login);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token",validateResetToken);
router.post("/reset-password/:token",resetPassword);
router.get("/me", getMe);



export default router;

//module.exports = router;

