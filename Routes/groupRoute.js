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
  createTeamByAdmin,autoOrganizeTeams,
  getAllTeams,
  getAllTeams_supervisedByMe
} from '../controllers/groupcontroller.js';
import { getStudentsByTeam } from '../controllers/studentcontroller.js';
import { protect, restrictedfor } from "../middlewares/authmiddleware.js";

const router = express.Router();
/**
 * @swagger
 * /api/v1/team/creategroup:
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
 * /api/v1/team/autoOrganizeTeams:
 *   post:
 *     summary: Automatically organize students into teams
 *     description: |
 *       Automatically assigns students to teams based on their year and specialization.
 *       - If one or more students from **3CS** are found without a team, a separate team will be created for each of them and no other students will be processed.
 *       - For other years, students are grouped into teams according to compatibility rules and team size.
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *             properties:
 *               year:
 *                 type: string
 *                 example: 2CS
 *                 description: The academic year of the students (e.g., 1CS, 2CS, 3CS)
 *               specialite:
 *                 type: string
 *                 example: SIW
 *                 description: Required only for 2CS students (e.g., ISI, SIW, IASD)
 *     responses:
 *       200:
 *         description: Students have been automatically organized into teams or 3CS students have been assigned to individual teams
 *       400:
 *         description: Missing required parameters or invalid input
 *       401:
 *         description: Unauthorized - Bearer token is missing or invalid
 *       403:
 *         description: Forbidden - User does not have permission
 *       500:
 *         description: Internal Server Error - Something went wrong on the server
 */


router.post('/autoOrganizeTeams', protect, restrictedfor('admin'), autoOrganizeTeams);



/**
 * @swagger
 * /api/v1/team/leaveTeam:
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
 * /api/v1/team/all:
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
 * /api/v1/team/allgroups:
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
 * /api/v1/team/myteam:
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
 * /api/v1/team/delete/{team_id}:
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
 * /api/v1/team/move-student:
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
 * /api/v1/team/admin/create-team:
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

/**
 * @swagger
 * /api/v1/teams/all-teams:
 *   get:
 *     summary: Get all teams with their members
 *     tags:
 *       - Team
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all teams
 */
router.get('/all-teams', protect, restrictedfor('admin', 'teacher'), getAllTeams);


/**
 * @swagger
 * /api/v1/team/supervised-by-me:
 *   get:
 *     summary: List all teams supervised by the current teacher
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teams supervised by the logged-in teacher
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 total:
 *                   type: integer
 *                   example: 3
 *                 teams:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       groupName:
 *                         type: string
 *                         example: "Team A"
 *                       supervisorId:
 *                         type: integer
 *                         example: 5
 *                       maxNumber:
 *                         type: integer
 *                         example: 5
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       members:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 10
 *                             firstname:
 *                               type: string
 *                               example: "John"
 *                             lastname:
 *                               type: string
 *                               example: "Doe"
 *                             year:
 *                               type: integer
 *                               example: 3
 *                             user:
 *                               type: object
 *                               properties:
 *                                 email:
 *                                   type: string
 *                                   example: "john.doe@example.com"
 *                       preflists:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             ML:
 *                               type: string
 *                               example: "Machine Learning"
 */
router.get('/supervised-by-me', protect,restrictedfor('teacher'), getAllTeams_supervisedByMe);


export default router;
