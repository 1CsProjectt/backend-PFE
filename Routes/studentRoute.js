import express from 'express';
import { 
  getStudentsByTeam, 
  listAllStudents 
} from '../controllers/studentcontroller.js';
import { protect,restrictedfor } from "../middlewares/authmiddleware.js";



// const express = require('express');
// const { getStudentsByGroup, listAllStudents } = require('../controllers/studentcontroller.js');
// const { protect } = require('../controllers/authentification.js');


const router = express.Router();


router.get('/liststudents', protect, listAllStudents);
router.get('/:team_id/students', protect, getStudentsByTeam);


export default router;


//module.exports = router;