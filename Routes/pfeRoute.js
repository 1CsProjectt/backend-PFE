import express from 'express';
import { protect, restrictedfor } from "../middlewares/authmiddleware.js";
import { uploadFiles } from '../middlewares/file_uploading.js'
import { upload } from '../utils/cloudinary.js';
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
    displayvalidePFE,autoAssignPfes
} from "../controllers/pfecontroller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PFE
 *   description: PFE-related operations
 */

/**
 * @swagger
 * /api/v1/pfe/depositPFE:
 *   post:
 *     summary: Upload PFE file
 *     tags: [PFE]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: My PFE Title
 *               specialization:
 *                 type: string
 *                 example: ISI
 *               supervisor:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["65436b3b85435824c6260bb2"]
 *               description:
 *                 type: string
 *                 example: This is a description of my PFE.
 *               year:
 *                 type: string
 *                 example: 2024
 *               pdfFile:
 *                 type: string
 *                 format: binary
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: PFE created successfully
 *       400:
 *         description: PDF file is required or Invalid input
 *       403:
 *         description: Invalid role
 *       404:
 *         description: Teacher not found
 */
router.post(
    '/depositPFE',
    protect,
    restrictedfor('teacher', 'company'),
    upload.fields([
        { name: 'pdfFile', maxCount: 1 },
        { name: 'photo', maxCount: 1 },
      ]),
    createPFE
);
router.post(
    '/autoAssignPfes',
    protect,
    restrictedfor('admin'),
    
    autoAssignPfes
);
/**
 * @swagger
 * /api/v1/pfe/delete/{id}:
 *   delete:
 *     summary: Delete PFE (only the creator can delete)
 *     tags: [PFE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the PFE to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PFE and associated files deleted successfully
 *       403:
 *         description: You are not authorized to delete this PFE
 *       404:
 *         description: PFE not found
 */
router.delete("/delete/:id", protect, restrictedfor('teacher'), deletePFEforcreator);

/**
 * @swagger
 * /api/v1/pfe/admin/delete/{id}:
 *   delete:
 *     summary: Admin can delete any PFE
 *     tags: [PFE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the PFE to delete (Admin only)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PFE and associated files deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: PFE not found
 */
router.delete("/admin/delete/:id", protect, restrictedfor("admin"), deletePFE);

/**
 * @swagger
 * /api/v1/pfe/download/{filename}:
 *   get:
 *     summary: Download PFE file
 *     tags: [PFE]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         description: Name of the file to download
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Error downloading the file
 */
router.get("/download/:filename", downloadfile);

/**
 * @swagger
 * /api/v1/pfe/:
 *   get:
 *     summary: Display all PFEs (teacher & company view)
 *     tags: [PFE]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of PFEs
 */
router.get("/", protect, restrictedfor("teacher", "company"), getAllPFE);

/**
 * @swagger
 * /api/v1/pfe/pending:
 *   get:
 *     summary: Display unvalidated PFEs (for validation)
 *     tags: [PFE]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of unvalidated PFEs
 */
router.get("/pending", protect, restrictedfor('admin'), displayPFE);

/**
 * @swagger
 * /api/v1/pfe/validpfe:
 *   get:
 *     summary: Display validated PFEs (for admin)
 *     tags: [PFE]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of validated PFEs
 */
router.get("/validpfe", protect, restrictedfor('admin'), displayvalidePFE);

/**
 * @swagger
 * /api/v1/pfe/for-students:
 *   get:
 *     summary: Display validated PFEs for students (based on their year and specialization)
 *     tags: [PFE]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of validated PFEs for students
 */
router.get("/for-students", protect, restrictedfor("student"), displayPFEforstudents);

/**
 * @swagger
 * /api/v1/pfe/this-year:
 *   get:
 *     summary: Display this year's PFEs
 *     tags: [PFE]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of this year's PFEs
 */
router.get("/this-year", protect, displaythisyearsPFE);

/**
 * @swagger
 * /api/v1/pfe/{pfeId}/add-supervisor:
 *   post:
 *     summary: Add Supervisor to a PFE
 *     tags: [PFE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pfeId
 *         required: true
 *         description: ID of the PFE to add supervisor to
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supervisors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["65436b3b85435824c6260bb2"]
 *     responses:
 *       200:
 *         description: Supervisors added successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: PFE not found
 */
router.post("/:pfeId/add-supervisor", protect, restrictedfor("teacher", "company"), addSupervisor);

/**
 * @swagger
 * /api/v1/pfe/{id}/validate:
 *   patch:
 *     summary: Validate a PFE (only admin can validate)
 *     tags: [PFE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the PFE to validate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PFE validated successfully
 *       404:
 *         description: PFE not found
 */
router.patch("/:id/validate", protect, restrictedfor("admin"), validatePFE);

/**
 * @swagger
 * /api/v1/pfe/my-pfes:
 *   get:
 *     summary: Get the PFEs created by the logged-in user
 *     tags: [PFE]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved PFEs created by the user
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: You have not created any PFEs.
 */
router.get("/my-pfes", protect, getMyPfe);

/**
 * @swagger
 * /api/v1/pfe/getPfes/{specialization}:
 *   get:
 *     summary: Get PFEs by specialization
 *     tags: [PFE]
 *     parameters:
 *       - in: path
 *         name: specialization
 *         required: true
 *         description: Specialization to filter PFEs by (ISI, IASD, SIW)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved PFEs by specialization
 *       400:
 *         description: Invalid specialization
 *       404:
 *         description: No PFEs found for this specialization.
 */
router.get("/getPfes/:specialization", getPfesBySpecialization);

/**
 * @swagger
 * /api/v1/pfe/searchForPfes:
 *   get:
 *     summary: Search for PFEs by title, supervisor's name/email, or creator's email
 *     tags: [PFE]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         description: Search query string
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved PFEs matching the search criteria
 *       400:
 *         description: Query parameter is required
 *       404:
 *         description: No PFEs found matching the search criteria.
 */
router.get("/searchForPfes", searchForPfes);

/**
 * @swagger
 * /api/v1/pfe/getIsiPfes:
 *   get:
 *     summary: Get PFEs with ISI specialization
 *     tags: [PFE]
 *     responses:
 *       200:
 *         description: Successfully retrieved ISI PFEs
 */
router.get('/getIsiPfes', getIsiPfes);

/**
 * @swagger
 * /api/v1/pfe/getIasdPfes:
 *   get:
 *     summary: Get PFEs with IASD specialization
 *     tags: [PFE]
 *     responses:
 *       200:
 *         description: Successfully retrieved IASD PFEs
 */
router.get('/getIasdPfes', getIasdPfes);

/**
 * @swagger
 * /api/v1/pfe/getSiwPfes:
 *   get:
 *     summary: Get PFEs with SIW specialization
 *     tags: [PFE]
 *     responses:
 *       200:
 *         description: Successfully retrieved SIW PFEs
 */
router.get('/getSiwPfes', getSiwPfes);

export default router;







// import express from 'express';

// import { protect,restrictedfor } from "../middlewares/authmiddleware.js";

// import { checkEventTime } from '../controllers/eventcontroller.js';

// import {uploadFiles} from '../middlewares/file_uploading.js'

// import {

//   getAllPFE,

//   createPFE,

//   deletePFE,

//   deletePFEforcreator,

//   displayPFE,

//   displaythisyearsPFE,

//   downloadfile,

//   displayPFEforstudents,

//   addSupervisor,

//   validatePFE,

//   getPfesBySpecialization,

//   searchForPfes,

//   getIsiPfes,

//   getIasdPfes

//   ,getSiwPfes,

//   getMyPfe,

//   displayvalidePFE

//  } from "../controllers/pfecontroller.js";















// const router = express.Router();

//  // ✅ Upload PFE file

// router.post(

//     '/depositPFE',

//     protect,

//     restrictedfor('teacher', 'company'),

//     uploadFiles,

//     createPFE

//   );

//  



//   // ✅ Delete PFE (only the creator can delete)

//   router.delete("/delete/:id", protect,restrictedfor('teacher'), deletePFEforcreator);

//  

//   // ✅ Admin can delete any PFE

//   router.delete("/admin/delete/:id", protect, restrictedfor("admin"), deletePFE);

//  

//   // ✅ Download PFE file

//   router.get("/download/:filename", downloadfile);

//  

//   // ✅ Display all PFEs (teacher & company view)

//   router.get("/", protect, restrictedfor("teacher","company"), getAllPFE);

//  

//   // ✅ Display unvalidated PFEs (for validation)

//   router.get("/pending",protect,restrictedfor('admin'), displayPFE);

//   //display valide PFEs for admin

//   router.get("/validpfe",protect,restrictedfor('admin'), displayvalidePFE);

//  

//   // ✅ Display validated PFEs for students (based on their year and specialite)

//   router.get("/for-students", protect, restrictedfor("student"), displayPFEforstudents);

//  

//   // ✅ Display this year's PFEs ex(2CS)

//   router.get("/this-year", protect, displaythisyearsPFE);

//  

//   // ✅ Add Supervisor to a PFE

//   router.post("/:pfeId/add-supervisor", protect, restrictedfor("teacher", "company"), addSupervisor);

//  

//   // ✅ Validate a PFE (only admin can validate)

//   router.patch("/:id/validate", protect, restrictedfor("admin"), validatePFE);



//   router.get("/my-pfes", protect, getMyPfe);



//  

// router.get("/getPfes/:specialization", getPfesBySpecialization);

// router.get("/searchForPfes", searchForPfes);

// router.get('/getIsiPfes', getIsiPfes);

// router.get('/getIasdPfes', getIasdPfes);

// router.get('/getSiwPfes', getSiwPfes);

//  

//   export default router;

//  



//   //module.exports = router;