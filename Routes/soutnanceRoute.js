import express from 'express';
import { uploadGlobalPlanning,getGlobalPlanningforstudent,getGlobalPlanningforteachers } from '../controllers/Soutnancecontroller.js';
import { protect } from '../middlewares/authmiddleware.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();
router.post(
  '/uploadGlobalPlanning',
  protect,
  restrictedfor('admin'), 
  upload.fields([{ name: 'soutplanning', maxCount: 1 }]),
  uploadGlobalPlanning
);

router.get(
  '/teacher',
  protect,
  restrictedFor('teacher'),
  getGlobalPlanningforteachers
);

router.get(
  '/student',
  protect,
  restrictedFor('student'),
  getGlobalPlanningforstudent
);

export default router;