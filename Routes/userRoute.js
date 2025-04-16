import express from "express";
import {
    createUser,
    updateUserByAdmin,
    getUser,
    getAllUsers,
    getAllUsersfrom_myyear,
    getAllStudents,
    getAllteachers,
    getAllcompanies,
    deletuser,
    searchForUser,
    searchForTeacher
} from "../controllers/userControler.js";
import { protect, restrictedfor } from "../middlewares/authmiddleware.js";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management routes
 */

/**
 * @swagger
 * /api/v1/users/create:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               year:
 *                 type: string
 *               specialite:
 *                 type: string
 *               companyName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               website:
 *                 type: string
 *               admin_level:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 user:
 *                   type: object
 *                   description: The newly created user data
 *       400:
 *         description: Bad request (missing or invalid data)
 *       401:
 *         description: Unauthorized (not logged in)
 *       403:
 *         description: Forbidden (not an admin)
 */

router.post("/create",protect, restrictedfor("admin"), createUser);

/**
 * @swagger
 * /api/v1/users/update:
 *   patch:
 *     summary: Update a user by admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Current email of the user to be updated
 *                 example: user@example.com
 *               newEmail:
 *                 type: string
 *                 description: New email to assign
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 description: New password to update
 *                 example: newPassword123
 *               username:
 *                 type: string
 *               firstname:
 *                 type: string
 *                 example: John
 *               lastname:
 *                 type: string
 *                 example: Doe
 *               year:
 *                 type: string
 *                 example: 2CS
 *               specialite:
 *                 type: string
 *                 example: ISIL
 *               companyName:
 *                 type: string
 *                 example: Tech Corp
 *               phone:
 *                 type: string
 *                 example: "+213123456789"
 *               address:
 *                 type: string
 *                 example: "123 Tech Street"
 *               website:
 *                 type: string
 *                 example: "https://techcorp.com"
 *               admin_level:
 *                 type: integer
 *                 example: 2
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["MANAGE_USERS", "VIEW_STATS"]
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: User 123 updated successfully
 *       400:
 *         description: Bad request (e.g. missing required fields or invalid input)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */




 router.patch("/update", protect,restrictedfor("admin"),  updateUserByAdmin);
router.get("/get/:id", protect, getUser);
router.get("/get-all", protect,restrictedfor('admin'), getAllUsers);
router.get("/get-my-year", protect,restrictedfor("student"),  getAllUsersfrom_myyear);
router.get("/students", protect, getAllStudents);
router.get("/teachers", protect, getAllteachers);
router.get("/companies", protect, getAllcompanies);
router.delete("/delete", protect, restrictedfor("admin"), deletuser);
router.get("/search", protect, searchForUser);
router.get("/teachers/search", protect, searchForTeacher);

export default router;
