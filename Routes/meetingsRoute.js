import express from "express";
import {
    startNewMeeting
 
} from "../controllers/meetingsController.js";
import {
  protect,
  restrictedfor,
} from "../middlewares/authmiddleware.js";

const router = express.Router();




router.post("/startNewMeeting", protect, restrictedfor("taehcer"), startNewMeeting);



export default router;
