import express from 'express';
import { 
  getStudentsByTeam, 
  listAllStudents,
  setStudentRole,
  editStudentRole
} from '../controllers/studentcontroller.js';
import { protect,restrictedfor } from "../middlewares/authmiddleware.js";



// const express = require('express');
// const { getStudentsByGroup, listAllStudents } = require('../controllers/studentcontroller.js');
// const { protect } = require('../controllers/authentification.js');


const router = express.Router();


router.get('/liststudents', protect, listAllStudents);
router.get('/:team_id/students', protect, getStudentsByTeam);
router.put('/set-role',protect,restrictedfor('student'), setStudentRole);
router.put('/edit-role',protect,restrictedfor('student'), editStudentRole);


export default router;


//module.exports = router;