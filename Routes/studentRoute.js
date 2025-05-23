import express from 'express';
import { 
  getStudentsByTeam, 
  listAllStudents,
  setStudentRole,
  editStudentRole,
} from '../controllers/studentcontroller.js';
import {createUsersFromFile} from '../controllers/autoucreate.js'
import { protect, restrictedfor } from "../middlewares/authmiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student-related operations
 */

/**
 * @swagger
 * /api/v1/student/liststudents:
 *   get:
 *     summary: List all students in the same year (excluding self)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a student)
 *       404:
 *         description: No students found or student record not found
 */
router.get('/liststudents', protect, listAllStudents);

/**
 * @swagger
 * /api/v1/student/{team_id}/students:
 *   get:
 *     summary: Get students by team ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: team_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the team
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *       400:
 *         description: Team id is required
 */
router.get('/:team_id/students', protect, getStudentsByTeam);

/**
 * @swagger
 * /api/v1/student/set-role:
 *   put:
 *     summary: Set student role (only if it's still 'member')
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 example: front-end
 *     responses:
 *       200:
 *         description: Role set successfully
 *       400:
 *         description: Role is missing or already set
 *       403:
 *         description: Unauthorized or not a student
 *       404:
 *         description: Student not found
 */
router.patch('/set-role', protect, restrictedfor('student'), setStudentRole);

/**
 * @swagger
 * /api/v1/student/edit-role:
 *   patch:
 *     summary: Edit student role
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 example: member
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Role is missing
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Student not found
 */
router.patch('/edit-role', protect, restrictedfor('student'), editStudentRole);

router.post('/autocreate',protect,createUsersFromFile)

export default router;
