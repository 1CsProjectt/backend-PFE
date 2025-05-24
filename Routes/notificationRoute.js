import express from "express";

const router = express.Router();
import {
  getMyNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount,
} from "../controllers/notificationControler.js";

import { protect } from '../middlewares/authmiddleware.js';

router.use(protect); 

router.get("/getMyNotifications", getMyNotifications);
router.patch("/:id/read", markNotificationAsRead);
router.get("/count/unread", getUnreadNotificationCount);

export default router;

