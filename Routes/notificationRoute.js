import express from "express";

const router = express.Router();
import {
  getMyNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount,
} from "../controllers/notificationControler.js";

import { protect } from '../middlewares/authmiddleware.js';

router.use(protect); 
/**
 * @swagger
 * tags:
 *   name: NOTIFICATIONS
 *   description: Operations related to user notifications
 */

/**
 * @swagger
 * /api/v1/notification/getMyNotifications:
 *   get:
 *     summary: Get all notifications for the logged-in user
 *     tags: [NOTIFICATIONS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 */
router.get("/getMyNotifications", getMyNotifications);


/**
 * @swagger
 * /api/v1/notification/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [NOTIFICATIONS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the notification to mark as read
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.patch("/:id/read", markNotificationAsRead);


/**
 * @swagger
 * /api/v1/notification/count/unread:
 *   get:
 *     summary: Get count of unread notifications
 *     tags: [NOTIFICATIONS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Number of unread notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *                   example: 5
 */

router.get("/count/unread", getUnreadNotificationCount);

export default router;

