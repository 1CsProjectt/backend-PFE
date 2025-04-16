import express from 'express';
import { protect, restrictedfor } from "../middlewares/authmiddleware.js";
import { uploadFiles } from '../middlewares/file_uploading.js'
import {
    getAllPFE,
    createPFE,
    deletePFE,
    deletePFEforcreator,
    displayPFE,
    displaythisyearsPFE,
    downloadfile,
    displayPFEforstudents,
    addSupervisor,
    validatePFE,
    getPfesBySpecialization,
    searchForPfes,
    getIsiPfes,
    getIasdPfes,
    getSiwPfes,
    getMyPfe,
    displayvalidePFE
} from "../controllers/pfecontroller.js";

const router = express.Router();

/**
 * @swagger
 * /depositPFE:
 * post:
 * summary: Upload PFE file
 * tags: [PFE]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * example: My PFE Title
 * specialization:
 * type: string
 * example: ISI
 * supervisor:
 * type: array
 * items:
 * type: string
 * example: ["65436b3b85435824c6260bb2"]
 * description:
 * type: string
 * example: This is a description of my PFE.
 * year:
 * type: string
 * example: 2024
 * pdfFile:
 * type: file
 * photo:
 * type: file
 * responses:
 * 201:
 * description: PFE created successfully
 * 400:
 * description: PDF file is required or Invalid input
 * 403:
 * description: Invalid role
 * 404:
 * description: Teacher not found
 */
router.post(
    '/depositPFE',
    protect,
    restrictedfor('teacher', 'company'),
    uploadFiles,
    createPFE
);

/**
 * @swagger
 * /delete/{id}:
 * delete:
 * summary: Delete PFE (only the creator can delete)
 * tags: [PFE]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * description: ID of the PFE to delete
 * schema:
 * type: string
 * responses:
 * 200:
 * description: PFE and associated files deleted successfully
 * 403:
 * description: You are not authorized to delete this PFE
 * 404:
 * description: PFE not found
 */
router.delete("/delete/:id", protect, restrictedfor('teacher'), deletePFEforcreator);

/**
 * @swagger
 * /admin/delete/{id}:
 * delete:
 * summary: Admin can delete any PFE
 * tags: [PFE]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * description: ID of the PFE to delete (Admin only)
 * schema:
 * type: string
 * responses:
 * 200:
 * description: PFE and associated files deleted successfully
 * 403:
 * description: Unauthorized
 * 404:
 * description: PFE not found
 */
router.delete("/admin/delete/:id", protect, restrictedfor("admin"), deletePFE);

/**
 * @swagger
 * /download/{filename}:
 * get:
 * summary: Download PFE file
 * tags: [PFE]
 * parameters:
 * - in: path
 * name: filename
 * required: true
 * description: Name of the file to download
 * schema:
 * type: string
 * responses:
 * 200:
 * description: File downloaded successfully
 * 404:
 * description: File not found
 * 500:
 * description: Error downloading the file
 */
router.get("/download/:filename", downloadfile);

/**
 * @swagger
 * /:
 * get:
 * summary: Display all PFEs (teacher & company view)
 * tags: [PFE]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of PFEs
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * example: success
 * count:
 * type: integer
 * example: 2
 * pfeList:
 * type: array
 * items:
 * type: object
 * properties:
 * id:
 * type: string
 * example: "65436b3b85435824c6260bb2"
 * title:
 * type: string
 * example: "PFE title"
 * specialization:
 * type: string
 * example: "ISI"
 * description:
 * type: string
 * example: "PFE description"
 * year:
 * type: string
 * example: "2024"
 * pdfFile:
 * type: string
 * example: "http://localhost:3000/uploads/file.pdf"
 * photo:
 * type: string
 * example: "http://localhost:3000/photos/photo.jpg"
 * createdAt:
 * type: string
 * format: date-time
 * updatedAt:
 * type: string
 * format: date-time
 * creator:
 * type: object
 * properties:
 * id:
 * type: string
 * example: "65436b3b85435824c6260bb1"
 * username:
 * type: string
 * example: "teacher1"
 * email:
 * type: string
 * example: "teacher1@example.com"
 * supervisors:
 * type: array
 * items:
 * type: object
 * properties:
 * id:
 * type: string
 * example: "65436b3b85435824c6260bb2"
 * name:
 * type: string
 * example: "Teacher Name"
 */
router.get("/", protect, restrictedfor("teacher", "company"), getAllPFE);

/**
 * @swagger
 * /pending:
 * get:
 * summary: Display unvalidated PFEs (for validation)
 * tags: [PFE]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of unvalidated PFEs
 */
router.get("/pending", protect, restrictedfor('admin'), displayPFE);

/**
 * @swagger
 * /validpfe:
 * get:
 * summary: Display validated PFEs (for admin)
 * tags: [PFE]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of validated PFEs
 */
router.get("/validpfe", protect, restrictedfor('admin'), displayvalidePFE);

/**
 * @swagger
 * /for-students:
 * get:
 * summary: Display validated PFEs for students (based on their year and specialite)
 * tags: [PFE]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of validated PFEs for students
 */
router.get("/for-students", protect, restrictedfor("student"), displayPFEforstudents);

/**
 * @swagger
 * /this-year:
 * get:
 * summary: Display this year's PFEs ex(2CS)
 * tags: [PFE]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of this year's PFEs
 */
router.get("/this-year", protect, displaythisyearsPFE);

/**
 * @swagger
 * /{pfeId}/add-supervisor:
 * post:
 * summary: Add Supervisor to a PFE
 * tags: [PFE]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: pfeId
 * required: true
 * description: ID of the PFE to add supervisor to
 * schema:
 * type: string
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * supervisors:
 * type: array
 * items:
 * type: string
 * example: ["65436b3b85435824c6260bb2"]
 * responses:
 * 200:
 * description: Supervisors added successfully
 * 400:
 * description: Please provide at least one valid supervisor ID or One or more supervisor IDs are invalid
 * 404:
 * description: PFE not found
 */
router.post("/:pfeId/add-supervisor", protect, restrictedfor("teacher", "company"), addSupervisor);

/**
 * @swagger
 * /{id}/validate:
 * patch:
 * summary: Validate a PFE (only admin can validate)
 * tags: [PFE]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * description: ID of the PFE to validate
 * schema:
 * type: string
 * responses:
 * 200:
 * description: PFE validated successfully
 * 404:
 * description: PFE not found
 */
router.patch("/:id/validate", protect, restrictedfor("admin"), validatePFE);

/**
 * @swagger
 * /my-pfes:
 * get:
 * summary: Get the PFEs created by the logged-in user
 * tags: [PFE]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Successfully retrieved PFEs created by the user
 * 401:
 * description: User not authenticated
 * 404:
 * description: You have not created any PFEs.
 */
router.get("/my-pfes", protect, getMyPfe);

/**
 * @swagger
 * /getPfes/{specialization}:
 * get:
 * summary: Get PFEs by specialization
 * tags: [PFE]
 * parameters:
 * - in: path
 * name: specialization
 * required: true
 * description: Specialization to filter PFEs by (ISI, IASD, SIW)
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Successfully retrieved PFEs by specialization
 * 400:
 * description: Invalid specialization
 * 404:
 * description: No PFEs found for this specialization.
 */
router.get("/getPfes/:specialization", getPfesBySpecialization);

/**
 * @swagger
 * /searchForPfes:
 * get:
 * summary: Search for PFEs by title, supervisor's name/email, or creator's email
 * tags: [PFE]
 * parameters:
 * - in: query
 * name: query
 * required: true
 * description: Search query string
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Successfully retrieved PFEs matching the search criteria
 * 400:
 * description: Query parameter is required
 * 404:
 * description: No PFEs found matching the search criteria.
 */
router.get("/searchForPfes", searchForPfes);

/**
 * @swagger
 * /getIsiPfes:
 * get:
 * summary: Get PFEs with ISI specialization
 * tags: [PFE]
 * responses:
 * 200:
 * description: Successfully retrieved ISI PFEs
 */
router.get('/getIsiPfes', getIsiPfes);

/**
 * @swagger
 * /getIasdPfes:
 * get:
 * summary: Get PFEs with IASD specialization
 * tags: [PFE]
 * responses:
 * 200:
 * description: Successfully retrieved IASD PFEs
 */
router.get('/getIasdPfes', getIasdPfes);

/**
 * @swagger
 * /getSiwPfes:
 * get:
 * summary: Get PFEs with SIW specialization
 * tags: [PFE]
 * responses:
 * 200:
 * description: Successfully retrieved SIW PFEs
 */
router.get('/getSiwPfes', getSiwPfes);

export default router;