import express from "express";
import { sendinvitation,getAllMyInvitations ,acceptInvitation,declineInvitation} from "../controllers/invitationcontroller.js";
import {protect,restrictedfor} from "../middlewares/authmiddleware.js";

const router = express.Router();

router.post("/sendinvitation",protect, sendinvitation);
router.get("/getallmyinvitations",protect,getAllMyInvitations)
router.post("/acceptInvitation", protect,acceptInvitation);
router.post("/declineInvitation",protect, declineInvitation);


export default router;
