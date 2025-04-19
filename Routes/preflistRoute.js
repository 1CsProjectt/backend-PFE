import express from 'express';
import { createPreflist } from '../controllers/preflistController.js';
import {protect,restrictedfor} from '../middlewares/authmiddleware.js'; 

const router = express.Router();

/**
 * @swagger
 * /api/v1/preflist/create:
 *   post:
 *     summary: Submit a preference list for a team
 *     description: Allows a student to submit a preflist of 5 PFEs for their team. Only one submission per team is allowed.
 *     tags:
 *       - Preflist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pfeIds
 *             properties:
 *               pfeIds:
 *                 type: array
 *                 description: An ordered array of 5 PFE IDs.
 *                 items:
 *                   type: integer
 *                 example: [3, 7, 12, 21, 34]
 *     responses:
 *       201:
 *         description: Preflist successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Preflist created for team 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       teamId:
 *                         type: integer
 *                         example: 1
 *                       pfeId:
 *                         type: integer
 *                         example: 3
 *                       order:
 *                         type: integer
 *                         example: 1
 *       400:
 *         description: Invalid input or preflist already submitted
 *       403:
 *         description: Unauthorized or user not a student
 */
router.post('/create', protect,restrictedfor('student'), createPreflist);

export default router;
