import express from "express";
import { sendJoinRequest,getAllJoinMyTeamRequests,acceptJoinRequest,rejectJoinRequests} from '../controllers/jointeamcontroller.js';
import { protect } from '../middlewares/authmiddleware.js'; 

const router = express.Router();

router.post("/sendjoinrequest", protect,sendJoinRequest);
router.post("/accepteJoinRequests",protect, acceptJoinRequest);
router.post("/rejectJoinRequests",protect, rejectJoinRequests);
router.get("/getalljoinmyteamrequests",protect, getAllJoinMyTeamRequests)
 
export default router;
 