import express from 'express';
import { uploadGlobalPlanning,getGlobalPlanningforstudent,getGlobalPlanningforteachers } from '../controllers/Soutnancecontroller.js';
import { protect,restrictedfor } from '../middlewares/authmiddleware.js';
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
  restrictedfor('teacher','admin'),
  getGlobalPlanningforteachers
);

router.get(
  '/student',
  protect,
  restrictedfor('student'),
  getGlobalPlanningforstudent
);

export default router;