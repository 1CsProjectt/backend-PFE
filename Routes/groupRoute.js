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
 * /api/v1/teams/creategroup:
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
 * /api/v1/teams/autoOrganizeTeams:
 *   post:
 *     summary: Automatically organize students into teams
 *     description: |
 *       Organize students into compatible teams based on their academic year and specialization.
 *       
 *       **Behavior by Year:**
 *       
 *       - **3CS**:
 *         - Each student is assigned to their own individual team (team of one).
 *         - No further processing (team clean-up, group assignment, etc.) occurs for other students.
 *       
 *       - **2CS & 1CS**:
 *         - Teams with fewer than `ceil(maxNumber / 2) + 1` members are deleted, and their students are marked as "available".
 *         - Remaining available students are assigned to existing compatible and non-full teams.
 *           - Compatibility is based on same year and, for 2CS, same specialization.
 *         - If few students remain (less than overflow threshold), they may overflow into already full compatible teams.
 *         - If no compatible team is found, a new team is created for the remaining students.
 *     
 *       **Additional Rules:**
 *       - `maxNumber` (default: 5) is used to limit team size.
 *       - Teams with 7 or more members are automatically excluded from further assignment.
 *       - Students assigned to a team have their `status` updated to `"in a team"`.
 *       - Deleted teams have their associated `JoinRequest` entries removed.
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
 *                 enum: [1CS, 2CS, 3CS]
 *                 example: 2CS
 *                 description: Academic year of the students to organize.
 *               specialite:
 *                 type: string
 *                 example: SIW
 *                 description: Required only for 2CS and 3CS (e.g., ISI, SIW, IASD).
 *     responses:
 *       200:
 *         description: |
 *           Students were successfully organized into teams:
 *             - 3CS: Each student gets a unique team.
 *             - 1CS & 2CS: Students are grouped based on compatibility.
 *       400:
 *         description: |
 *           - Missing required fields (e.g., year, specialization).
 *           - Invalid input data.
 *       401:
 *         description: Unauthorized - Bearer token missing or invalid.
 *       403:
 *         description: Forbidden - User does not have permission.
 *       500:
 *         description: Internal server error.
 */


router.post('/autoOrganizeTeams', protect, restrictedfor('admin'), autoOrganizeTeams);



/**
 * @swagger
 * /api/v1/teams/leaveTeam:
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
 * /api/v1/teams/all:
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
 * /api/v1/teams/allgroups:
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
 * /api/v1/teams/myteam:
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
 * /api/v1/teams/delete/{team_id}:
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
 * /api/v1/teams/move-student:
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
 * /api/v1/teams/admin/create-team:
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
 * /api/v1/teams/supervised-by-me:
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
