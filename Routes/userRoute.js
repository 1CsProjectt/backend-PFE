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


 /**
 * @swagger
 * /api/v1/users/get/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: User not found
 */

router.get("/get/:id", protect, getUser);


/**
 * @swagger
 * /api/v1/users/get-all:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Forbidden (admin only)
 */

router.get("/get-all", protect,restrictedfor('admin'), getAllUsers);



/**
 * @swagger
 * /api/v1/users/get-my-year:
 *   get:
 *     summary: Get all users from the same academic year
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users from the same year
 *       400:
 *         description: Current user or student record not found
 *       403:
 *         description: Forbidden (student only)
 */

router.get("/get-my-year", protect,restrictedfor("student"),  getAllUsersfrom_myyear);


/**
 * @swagger
 * /api/v1/users/students:
 *   get:
 *     summary: Get all student records
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 *       500:
 *         description: Error fetching users
 */

router.get("/students", protect, getAllStudents);


/**
 * @swagger
 * /api/v1/users/teachers:
 *   get:
 *     summary: Get all teacher records
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teachers
 *       400:
 *         no teachers where found
 *       500:
 *         description: Error fetching users
 */

router.get("/teachers", protect, getAllteachers);


/**
 * @swagger
 * /api/v1/users/companies:
 *   get:
 *     summary: Get all company records
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *       500:
 *         description: Error fetching users
 */

router.get("/companies", protect, getAllcompanies);


/**
 * @swagger
 * /api/v1/users/delete:
 *   delete:
 *     summary: Delete a user by ID or email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 5
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: User(s) deleted successfully
 *       400:
 *         description: Missing ID or email
 *       404:
 *         description: No user found
 */

router.delete("/delete", protect, restrictedfor("admin"), deletuser);


/**
 * @swagger
 * /api/v1/users/search:
 *   get:
 *     summary: Search for users by username or email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Username or email search term
 *     responses:
 *       200:
 *         description: Users found
 *       400:
 *         description: Query parameter missing
 *       404:
 *         description: No users found
 */

router.get("/search", protect, searchForUser);
/**
 * @swagger
 * /api/v1/users/teachers/search:
 *   get:
 *     summary: Search for teachers by firstname, lastname, or email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         required: true
 *         description: Name or email to search for
 *     responses:
 *       200:
 *         description: Teachers found
 *       400:
 *         description: Missing search term
 */

router.get("/teachers/search", protect, searchForTeacher);

export default router;
