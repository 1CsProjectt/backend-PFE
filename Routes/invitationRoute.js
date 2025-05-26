import express from "express";
import { sendInvitations,getAllMypendingInvitations ,acceptInvitation,declineInvitation,getAllMyrecievedInvitations,cancelInvitation} from "../controllers/invitationcontroller.js";
import {protect,restrictedfor} from "../middlewares/authmiddleware.js";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Invitations
 *   description: invitations operations
 */



/**
 * @swagger
 * /api/v1/invitation/sendinvitation:
 *   post:
 *     summary: Send team invitations
 *     description: |
 *       Allows a student in a team to invite other available students (from the same year and optionally the same specialization)
 *       to join their team. The sender must already be in a team and can only invite students if slots are available.
 *       
 *       **Key Rules:**
 *       - Only students can send invitations.
 *       - Sender must already belong to a team.
 *       - A team can have a maximum of 6 members.
 *       - The receiver must:
 *         - Exist in the system.
 *         - Be from the same academic year as the sender.
 *         - Be from the same specialization if the sender has one.
 *         - Not already be part of a team.
 *         - Not already have a pending invitation from the sender.
 *       - Real-time notification is sent via Socket.IO to the invited student.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiver_emails
 *             properties:
 *               receiver_emails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - student1@example.com
 *                   - student2@example.com
 *     responses:
 *       201:
 *         description: Invitations processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitations processed
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: student1@example.com
 *                       status:
 *                         type: string
 *                         enum: [success, failed]
 *                         example: success
 *                       reason:
 *                         type: string
 *                         nullable: true
 *                         example: Student already in a team
 *       400:
 *         description: |
 *           - receiver_emails is missing or empty
 *           - Exceeded number of remaining slots in the team
 *       401:
 *         description: Unauthorized - Bearer token missing or invalid
 *       403:
 *         description: Forbidden - Sender is not in a team
 *       404:
 *         description: |
 *           - Sender student profile not found
 *           - Sender's team not found (team may have been deleted)
 *       500:
 *         description: Internal server error
 */

router.post("/sendinvitation",protect, sendInvitations);
/**
 * @swagger
 * /api/v1/invitation/cancelInvitation:
 *   delete:
 *     summary: Cancel a pending team invitation
 *     description: |
 *       Allows the sender of a pending team invitation to cancel it.
 *       
 *       **Key Rules:**
 *       - Only the sender of the invitation can cancel it.
 *       - The invitation must still be in a `pending` state.
 *       - If the invitation is not found or already accepted/refused, it cannot be cancelled.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitationId
 *             properties:
 *               invitationId:
 *                 type: integer
 *                 example: 123
 *                 description: ID of the invitation to be canceled
 *     responses:
 *       200:
 *         description: Invitation canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: invitation has been canceled successfully
 *       401:
 *         description: Unauthorized - Bearer token missing or invalid
 *       404:
 *         description: No pending invitation found with this ID
 *       500:
 *         description: Internal server error
 */

router.delete("/cancelInvitation",protect, cancelInvitation);
/**
 * @swagger
 * /api/v1/invitation/getallmyinvitations:
 *   get:
 *     summary: Get all my pending sent invitations
 *     description: |
 *       Retrieves all pending team invitations sent by the currently authenticated user (student).
 *       
 *       **Details Returned:**
 *       - Each pending invitation includes sender info and the receiver email.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending invitations sent by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 101
 *                   receiver_email:
 *                     type: string
 *                     example: student@example.com
 *                   status:
 *                     type: string
 *                     example: pending
 *                   sender_id:
 *                     type: integer
 *                     example: 15
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   sender:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 15
 *                       user:
 *                         type: object
 *                         properties:
 *                           email:
 *                             type: string
 *                             example: sender@example.com
 *       401:
 *         description: Unauthorized - Bearer token missing or invalid
 *       500:
 *         description: Internal server error
 */

router.get("/getallmyinvitations",protect,getAllMypendingInvitations);
/**
 * @swagger
 * /api/v1/invitation/getallmyrecievedinvitations:
 *   get:
 *     summary: Get all my received pending invitations
 *     description: |
 *       Retrieves all pending team invitations received by the currently authenticated user (student).
 *       
 *       **Details Returned:**
 *       - Each invitation includes the sender's information and the sender's email.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending invitations received by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 202
 *                   receiver_email:
 *                     type: string
 *                     example: student@example.com
 *                   status:
 *                     type: string
 *                     example: pending
 *                   sender_id:
 *                     type: integer
 *                     example: 10
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   sender:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 10
 *                       user:
 *                         type: object
 *                         properties:
 *                           email:
 *                             type: string
 *                             example: sender@example.com
 *       401:
 *         description: Unauthorized - Bearer token missing or invalid
 *       500:
 *         description: Internal server error
 */

router.get("/getallmyrecievedinvitations",protect,getAllMyrecievedInvitations);
/**
 * @swagger
 * /api/v1/invitation/acceptInvitation:
 *   post:
 *     summary: Accept an invitation to join a team
 *     description: |
 *       Allows a student to accept a pending invitation they received. Once accepted:
 *       - The student's `team_id` is updated to match the sender's team.
 *       - The student's status becomes `"in a team"`.
 *       - All other pending invitations for that student are automatically rejected.
 *       - If the sender's team reaches its `maxNumber`, the team is marked as full.
 *       
 *       **Authorization Requirements:**
 *       - Only the student who received the invitation can accept it.
 *       - Invitation must be in `"pending"` status.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitationId
 *             properties:
 *               invitationId:
 *                 type: integer
 *                 example: 123
 *                 description: ID of the invitation to accept.
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitation accepted successfully
 *       400:
 *         description: |
 *           - Invitation already accepted or rejected
 *       403:
 *         description: User not authorized to accept this invitation
 *       404:
 *         description: |
 *           - Invitation not found
 *           - Sender or receiver not found
 *       401:
 *         description: Unauthorized - Bearer token missing or invalid
 *       500:
 *         description: Internal server error
 */

router.patch("/acceptInvitation", protect,acceptInvitation);
/**
 * @swagger
 * /api/v1/invitation/decline:
 *   post:
 *     summary: Decline a team invitation
 *     description: |
 *       Allows a student to decline a pending team invitation they have received.
 *       
 *       **Behavior:**
 *       - Only the student who received the invitation can decline it.
 *       - The invitation must be in `"pending"` status.
 *       - The status of the invitation will be updated to `"rejected"`.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitationId
 *             properties:
 *               invitationId:
 *                 type: integer
 *                 example: 123
 *                 description: ID of the invitation to decline.
 *     responses:
 *       200:
 *         description: Invitation declined successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitation declined successfully
 *       400:
 *         description: |
 *           - Invitation already accepted or rejected
 *       403:
 *         description: User not authorized to decline this invitation
 *       404:
 *         description: Invitation not found
 *       401:
 *         description: Unauthorized - Bearer token missing or invalid
 *       500:
 *         description: Internal server error
 */

router.post("/declineInvitation",protect, declineInvitation);


export default router;
