import express from "express";
import { setEvent, checkEventTime,updateEvent } from "../controllers/eventcontroller.js";
import { protect,restrictedfor } from "../middlewares/authmiddleware.js";

// const express = require("express");
// const { setEvent, checkEventTime } = require("../controllers/eventcontroller.js");
// const { protect, restrictedfor } = require("../controllers/authentification.js");


const router = express.Router();

// Route to create or update an event/session
router.post("/setsessoin",protect,restrictedfor('admin'), setEvent);

// Example usage of checkEventTime middleware on a protected route
router.post("/some-protected-route", checkEventTime("MY_EVENT"), (req, res) => {
    res.status(200).json({ status: "success", message: "You have access to this session!" });
});
router.patch("/update", protect, restrictedfor("admin"), updateEvent);

export default router;

//module.exports = router;
