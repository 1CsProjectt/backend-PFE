import express from 'express';
import {
  createPreflist,
  updatePreflist,
  removeFromPreflist,
  respondToRequest
} from '../controllers/preflistController.js';
import { protect, restrictedfor } from '../middlewares/authmiddleware.js';

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
router.post('/create', protect, restrictedfor('student'), createPreflist);

/**
 * @swagger
 * /api/v1/preflist/update:
 *   patch:
 *     summary: Update an existing preflist
 *     description: Replaces the team's existing preflist with a new list of 5 PFEs.
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
 *                 items:
 *                   type: integer
 *                 example: [5, 6, 7, 8, 9]
 *     responses:
 *       200:
 *         description: Preflist updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized
 */
router.put('/update', protect, restrictedfor('student'), updatePreflist);

/**
 * @swagger
 * /api/v1/preflist/{pfeId}:
 *   delete:
 *     summary: Remove a specific PFE from the preflist
 *     description: Deletes a specific PFE entry from the student's team preflist.
 *     tags:
 *       - Preflist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pfeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the PFE to remove
 *     responses:
 *       200:
 *         description: PFE removed successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: PFE not found in preflist
 */
router.delete('/:pfeId', protect, restrictedfor('student'), removeFromPreflist);

/**
 * @swagger
 * /api/v1/preflist/supervision-request/{id}:
 *   patch:
 *     summary: Respond to a supervision request
 *     description: Allows a supervisor to accept or reject a pending supervision request.
 *     tags:
 *       - Supervision Requests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the supervision request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, REJECTED]
 *                 example: ACCEPTED
 *     responses:
 *       200:
 *         description: Supervision request responded successfully
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
 *                   example: Request accepted successfully.
 *       400:
 *         description: Invalid request or already processed
 *       404:
 *         description: Supervision request not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id', protect, restrictedfor('teacher'), respondToRequest);

export default router;
