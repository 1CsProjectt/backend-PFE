import express from "express";
import { sendInvitations,getAllMypendingInvitations ,acceptInvitation,declineInvitation,getAllMyrecievedInvitations} from "../controllers/invitationcontroller.js";
import {protect,restrictedfor} from "../middlewares/authmiddleware.js";

const router = express.Router();

router.post("/sendinvitation",protect, sendInvitations);
router.get("/getallmyinvitations",protect,getAllMypendingInvitations);
router.get("/getallmyrecievedinvitations",protect,getAllMyrecievedInvitations);
router.patch("/acceptInvitation", protect,acceptInvitation);
router.post("/declineInvitation",protect, declineInvitation);


export default router;
