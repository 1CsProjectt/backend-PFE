import express from "express";
import {
  setEvent,
  checkEventTime,
  updateEvent,
  getAllEvents,
} from "../controllers/eventcontroller.js";
import {
  protect,
  restrictedfor,
} from "../middlewares/authmiddleware.js";

const router = express.Router();



/**
 * @swagger
 * /api/v1/session/setsessoin:
 *   post:
 *     summary: Create or update an event/session
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startTime
 *               - endTime
 *             properties:
 *               name:
 *                 type: string
 *                 enum: [PFE_SUBMISSION, PFE_VALIDATION, TEAM_CREATION, PFE_ASSIGNMENT, WORK_STARTING]
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               maxNumber:
 *                 type: integer
 *                 description: Required only for TEAM_CREATION
 *               targeted:
 *                 type: string
 *                 enum: [students, teachers]
 *               year:
 *                 type: string
 *                 enum: [2CP, 1CS, 2CS, 3CS]
 *     responses:
 *       200:
 *         description: Session created/updated successfully
 *       400:
 *         description: Invalid input or an active session already exists
 */
router.post("/setsessoin", protect, restrictedfor("admin"), setEvent);

/**
 * @swagger
 * /api/v1/session/some-protected-route:
 *   post:
 *     summary: Access a protected route based on session timing
 *     tags: [Events]
 *     requestBody:
 *       description: Requires a valid user JWT
 *     responses:
 *       200:
 *         description: Access granted
 *       403:
 *         description: Session has not started or has ended
 */
router.post("/some-protected-route", checkEventTime("MY_EVENT"), (req, res) => {
  res
    .status(200)
    .json({ status: "success", message: "You have access to this session!" });
});

/**
 * @swagger
 * /api/v1/session/update:
 *   patch:
 *     summary: Update an existing event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - year
 *               - startTime
 *               - endTime
 *             properties:
 *               name:
 *                 type: string
 *               year:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               maxNumber:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Invalid input or update error
 *       404:
 *         description: Event not found
 */
router.patch("/update", protect, restrictedfor("admin"), updateEvent);

/**
 * @swagger
 * /api/v1/session/allevents:
 *   get:
 *     summary: Retrieve all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of all events
 *       404:
 *         description: No events found
 */
router.get("/allevents", getAllEvents);

export default router;
