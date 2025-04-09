import express from 'express';
import { createTeam,leaveTeam,listAllTeams,showMyTeam,listAllTeamsforstudent} from '../controllers/groupcontroller.js';
import { getStudentsByTeam } from '../controllers/studentcontroller.js';
import { protect,restrictedfor } from "../middlewares/authmiddleware.js";
import { checkEventTime } from '../controllers/eventcontroller.js';

// const express = require('express');
// const { createGroup } = require('../controllers/groupcontroller.js');
// const { getStudentsByGroup } = require('../controllers/studentcontroller.js');
// const { protect, restrictedfor } = require('../controllers/authentification.js');
// const { checkEventTime } = require('../controllers/eventcontroller.js');




const router = express.Router();
router.post('/creategroup',protect,restrictedfor('student') ,createTeam);
router.get('/:groupId/students', getStudentsByTeam);
router.patch("/leaveTeam",protect, leaveTeam);
router.get('/all', protect, listAllTeams);
router.get('/allgroups', protect,restrictedfor('student'), listAllTeamsforstudent);
router.get('/myteam', protect, showMyTeam);


export default router;

//module.exports = router;
