import express from "express";
import {
  startNewMeeting,
  getAllMeetings,
  cancelMeeting,
  getNextMeet,
  updateMeeting,
} from "../controllers/meetingsController.js";
import {
  protect,
  restrictedfor,
} from "../middlewares/authmiddleware.js";
import { upload } from "../utils/cloudinary.js";
const router = express.Router();




/**
 * @swagger
 * tags:
 *   name: MEETINGS
 *   description: MEETINGS-related operations
 */ 


/**
 * @swagger
 * /api/v1/mettings/startNewMeeting/{teamId}:
 *   post:
 *     summary: Start a new meeting for a specific team (only the supervisor can do it)
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         description: ID of the team to start a meeting for
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - time
 *               - room
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-01"
 *               time:
 *                 type: string
 *                 format: time
 *                 example: "10:00:00"
 *               room:
 *                 type: string
 *                 example: "Room A"
 *               Meeting_objectives_files:
 *                 type: string
 *                 example: "objectives.pdf"
 *     responses:
 *       201:
 *         description: Meeting started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success starting new meeting for team GroupA
 *                 data:
 *                   type: object
 *                   properties:
 *                     mymeet:
 *                       $ref: '#/components/schemas/Meeting'
 *       403:
 *         description: You are not authorized to start a meeting for this team
 *       404:
 *         description: Team not found
 */

// Start a new meeting (only teachers allowed)
router.post("/startNewMeeting/:teamId", protect, 
  restrictedfor("teacher"),
  upload.fields([
    { name: 'Meeting_objectives_files', maxCount: 1 },
    { name: 'Support_files', maxCount: 1 },
    { name: 'Team_deliverables_files', maxCount: 1 },
    { name: 'My_review_for_deliverables_files', maxCount: 1 },
    { name: 'Meeting_pv_files', maxCount: 1 }
  ]),
 startNewMeeting);
/**
 * @swagger
 * /api/v1/mettings/getAllMeetings/{teamId}:
 *   get:
 *     summary: Get all meetings for a specific team
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         description: ID of the team
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of meetings retrieved successfully
 *       404:
 *         description: No meetings found for this team
 */

// Get all meetings for a team (accessible by teacher or student)
router.get("/getAllMeetings/:teamId", protect, restrictedfor("teacher", "student"), getAllMeetings);
/**
 * @swagger
 * /api/v1/mettings/cancelMeeting/{meetingId}:
 *   delete:
 *     summary: Cancel (delete) a specific meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         description: ID of the meeting to delete
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Meeting deleted successfully
 *       404:
 *         description: Meeting not found
 */

// Cancel (delete) a meeting (only teacher)
router.delete("/cancelMeeting/:meetingId", protect, restrictedfor("teacher"), cancelMeeting);
/**
 * @swagger
 * /api/v1/mettings/getNextMeet/{teamId}:
 *   get:
 *     summary: Get the next upcoming meeting for a team
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         description: ID of the team
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Next meeting retrieved successfully
 *       404:
 *         description: No upcoming meetings found for this team
 */

// Get the next upcoming meeting (teacher or student)
router.get("/getNextMeet/:teamId", protect, restrictedfor("teacher", "student"), getNextMeet);
/**
 * @swagger
 * /api/v1/mettings/updateMeeting/{meetingId}:
 *   patch:
 *     summary: Update details of a meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         description: ID of the meeting to update
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-10"
 *               time:
 *                 type: string
 *                 format: time
 *                 example: "14:00:00"
 *               room:
 *                 type: string
 *                 example: "Room B"
 *               Meeting_objectives_files:
 *                 type: string
 *                 example: "updated_objectives.pdf"
 *     responses:
 *       200:
 *         description: Meeting updated successfully
 *       404:
 *         description: Meeting not found
 */

// Update a meeting (only teacher)
router.patch("/updateMeeting/:meetingId", protect, restrictedfor("teacher"),upload.fields([
    { name: 'Meeting_objectives_files', maxCount: 1 },
    { name: 'Support_files', maxCount: 1 },
    { name: 'Team_deliverables_files', maxCount: 1 },
    { name: 'My_review_for_deliverables_files', maxCount: 1 },
    { name: 'Meeting_pv_files', maxCount: 1 }
  ]), updateMeeting);

export default router;
