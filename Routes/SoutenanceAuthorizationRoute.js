import express from 'express';
import {
  createSoutenanceAuthorization,
  updateSoutenanceAuthorization,
  deleteSoutenanceAuthorization
} from '../controllers/soutcontroller.js';
import { protect } from '../middlewares/authmiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Create a soutenance authorization
router.post('/', createSoutenanceAuthorization);

// Update an existing soutenance authorization
router.patch('/:id', updateSoutenanceAuthorization);

// Delete a soutenance authorization
router.delete('/:id', deleteSoutenanceAuthorization);

export default router;
