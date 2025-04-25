import express from 'express';
import {
  createPreflist,
  updatePreflist,
  removeFromPreflist,
  respondToRequest,
  acceptRandomRequestsForMultiplePFEs,
  getMyPreflist,
  approvePreflist,
  getAllrequests,
  filterRequestsByGrade,
  filterRequestsBySpecialization
} from '../controllers/preflistController.js';
import { protect, restrictedfor } from '../middlewares/authmiddleware.js';
import { upload } from '../utils/cloudinary.js';

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pfeIds
 *             properties:
 *               pfeIds:
 *                 type: string
 *                 description: A JSON stringified ordered array of 5 PFE IDs.
 *                 example: "[3, 7, 12, 21, 34]"
 *               ML:
 *                 type: string
 *                 format: binary
 *                 description: Optional file upload field (e.g., a machine learning model or report).
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
router.post('/create', protect, restrictedfor('student'),upload.fields([{ name: 'ML', maxCount: 1 },]), createPreflist);

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
router.patch('/supervision-request/:id', protect, restrictedfor('teacher'), respondToRequest);


/**
 * @swagger
 * /api/v1/preflist/supervision-request/accept-random:
 *   post:
 *     summary: Accept random supervision requests for multiple PFEs
 *     description: For each provided PFE ID, accepts a number of random pending supervision requests and rejects the rest for that PFE.
 *     tags:
 *       - Supervision Requests
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
 *               - numberToAccept
 *             properties:
 *               pfeIds:
 *                 type: array
 *                 description: List of PFE IDs to process
 *                 items:
 *                   type: integer
 *                 example: [3, 7, 12]
 *               numberToAccept:
 *                 type: integer
 *                 description: Number of requests to accept per PFE
 *                 example: 2
 *     responses:
 *       200:
 *         description: Requests processed successfully
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
 *                   example: Requests processed successfully for all PFEs
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       pfeId:
 *                         type: integer
 *                         example: 3
 *                       accepted:
 *                         type: array
 *                         items:
 *                           type: integer
 *                         example: [10, 12]
 *                       rejected:
 *                         type: array
 *                         items:
 *                           type: integer
 *                         example: [11]
 *       400:
 *         description: Invalid input
 */

router.post(
    '/supervision-request/accept-random',
    protect,
    restrictedfor('teacher'),
    acceptRandomRequestsForMultiplePFEs
  );


/**
 * @swagger
 * /api/v1/preflist/getAllrequests:
 *   get:
 *     summary: Get all supervision requests (teacher only)
 *     tags:
 *       - Supervision Requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all supervision requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       teamId:
 *                         type: integer
 *                       pfeId:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         example: PENDING
 *                       sentAt:
 *                         type: string
 *                         format: date-time
 *                       ML:
 *                         type: string
 *                         description: URL or path to motivation letter
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */

router.get(
  '/getAllrequests',
  protect,
  restrictedfor('teacher'),
  getAllrequests
);


/**
* @swagger
* /api/v1/preflist/filterRequestsByGrade/{grade}:
*   get:
*     summary: Filter supervision requests by grade (teacher only)
*     tags:
*       - Supervision Requests
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: path
*         name: grade
*         required: true
*         schema:
*           type: string
*           example: 3CS
*         description: The academic grade to filter by (e.g., 2CP, 1CS, 3CS)
*     responses:
*       200:
*         description: List of supervision requests filtered by grade
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: success
*                 data:
*                   type: array
*                   items:
*                     type: object
*                     properties:
*                       id:
*                         type: integer
*                       teamId:
*                         type: integer
*                       pfeId:
*                         type: integer
*                       status:
*                         type: string
*                         example: PENDING
*                       sentAt:
*                         type: string
*                         format: date-time
*       400:
*         description: Invalid grade provided
*       401:
*         description: Unauthorized
*       403:
*         description: Access denied
*/




/**
 * @swagger
 * /filterRequestsByGrade/{grade}:
 *   get:
 *     summary: Filters supervision requests by student grade.
 *     description: Fetches all supervision requests for a specific grade.
 *     tags: [Supervision Requests]
 *     parameters:
 *       - in: path
 *         name: grade
 *         required: true
 *         description: The grade of the students (e.g., '2CS', '3CS', etc.)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved supervision requests for the given grade.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       teamId:
 *                         type: integer
 *                         example: 1
 *                       specialization:
 *                         type: string
 *                         example: ISI
 *                       pfeTitle:
 *                         type: string
 *                         example: "Machine Learning in ISI"
 *                       grade:
 *                         type: string
 *                         example: '2CS'
 *                       status:
 *                         type: string
 *                         example: PENDING
 *       400:
 *         description: Grade parameter is required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Grade is required.
 *       401:
 *         description: User is not authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: User not authenticated.
 *       404:
 *         description: No requests found for the specified grade.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: No requests found for this grade.
 */

router.get(
  '/filterRequestsByGrade/:grade',
  protect,
  restrictedfor('teacher'),
  filterRequestsByGrade
);



/**
 * @swagger
 * /filterRequestsBySpecialization/{specialization}:
 *   get:
 *     summary: Filters supervision requests by student specialization.
 *     description: Fetches all supervision requests for a specific specialization.
 *     tags: [Supervision Requests]
 *     parameters:
 *       - in: path
 *         name: specialization
 *         required: true
 *         description: The specialization of the students (e.g., 'ISI', 'SIW', etc.)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved supervision requests for the given specialization.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       teamId:
 *                         type: integer
 *                         example: 2
 *                       specialization:
 *                         type: string
 *                         example: ISI
 *                       pfeTitle:
 *                         type: string
 *                         example: "Data Analysis in ISI"
 *                       grade:
 *                         type: string
 *                         example: '3CS'
 *                       status:
 *                         type: string
 *                         example: ACCEPTED
 *       400:
 *         description: Specialization parameter is required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Specialization is required.
 *       401:
 *         description: User is not authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: User not authenticated.
 *       404:
 *         description: No requests found for the specified specialization.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: No requests found for this specialization.
 */

router.get(
  '/filterRequestsBySpecialization/:specialization',
  protect,
  restrictedfor('teacher'),
  filterRequestsBySpecialization
);
   
  /**
 * @swagger
 * /api/v1/preflist/my:
 *   get:
 *     summary: Get the current student's preflist
 *     tags:
 *       - Preflist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the preflist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       teamId:
 *                         type: integer
 *                       pfeId:
 *                         type: integer
 *                       order:
 *                         type: integer
 *                       pfe:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           year:
 *                             type: string
 *                           specialite:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Student is not in a team
 *       404:
 *         description: No preflist found or student not found
 */
router.get('/my', protect, getMyPreflist);

/**
 * @swagger
 * /api/v1/preflist/{teamId}/approve:
 *   post:
 *     summary: Approve a team's preflist and send the first supervision request
 *     tags:
 *       - Preflist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the team whose preflist you’re approving
 *     responses:
 *       200:
 *         description: Preflist approved and first supervision request sent
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Preflist not found
 */
router.post(
  '/approve',
  protect,
  restrictedfor('student'),
  approvePreflist
);
  

export default router;
