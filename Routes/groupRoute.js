import express from 'express';
import {
  createTeam,
  leaveTeam,
  listAllTeams,
  showMyTeam,
  listAllTeamsforstudent,
  addStudentsToTeam,
  destroyTeam,
  moveStudentsToAnotherTeam,
  createTeamByAdmin
} from '../controllers/groupcontroller.js';
import { getStudentsByTeam } from '../controllers/studentcontroller.js';
import { protect, restrictedfor } from "../middlewares/authmiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/team/creategroup:
 *   post:
 *     summary: Create a new team
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Team created successfully
 */
router.post('/creategroup', protect, restrictedfor('student'), createTeam);

/**
 * @swagger
 * /api/team/{groupId}/students:
 *   get:
 *     summary: Get students of a team
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of students in the team
 */
router.get('/:groupId/students', getStudentsByTeam);

/**
 * @swagger
 * /api/team/leaveTeam:
 *   patch:
 *     summary: Leave a team
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Left the team successfully
 */
router.patch('/leaveTeam', protect, leaveTeam);

/**
 * @swagger
 * /api/team/all:
 *   get:
 *     summary: List all teams
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all teams
 */
router.get('/all', protect, listAllTeams);

/**
 * @swagger
 * /api/team/allgroups:
 *   get:
 *     summary: List all teams for student's year
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Filtered list of teams
 */
router.get('/allgroups', protect, restrictedfor('student'), listAllTeamsforstudent);

/**
 * @swagger
 * /api/team/myteam:
 *   get:
 *     summary: Get the current user's team
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Team of current student
 */
router.get('/myteam', protect, showMyTeam);

/**
 * @swagger
 * /api/team/delete/{team_id}:
 *   delete:
 *     summary: Delete a team by admin
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: team_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team deleted
 */
router.delete('/delete/:team_id', protect, restrictedfor('admin'), destroyTeam);

/**
 * @swagger
 * /api/team/move-student:
 *   patch:
 *     summary: Move students to another team
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               newTeamId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Students moved successfully
 */
router.patch('/move-student', protect, restrictedfor('admin'), moveStudentsToAnotherTeam);

/**
 * @swagger
 * /api/team/admin/create-team:
 *   post:
 *     summary: Admin creates a new team
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupName:
 *                 type: string
 *               supervisorId:
 *                 type: integer
 *               maxNumber:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Team created by admin
 */
router.post('/admin/create-team', protect, restrictedfor('admin'), createTeamByAdmin);

export default router;
