import express from "express";
import {
    createUser,
    updateUser,
    getUser,
    getAllUsers,
    getAllUsersfrom_myyear,
    getAllStudents,
    getAllteachers,
    getAllcompanies,
    deletuser,
    searchForUser
} from "../controllers/userControler.js";
import { protect, restrictedfor } from "../middlewares/authmiddleware.js";

const router = express.Router();

// User Routes
router.post("/create",protect, restrictedfor("admin"), createUser);
router.patch("/update", protect,restrictedfor("admin"),  updateUser);
router.get("/get/:id", protect, getUser);
router.get("/get-all", protect,restrictedfor('admin'), getAllUsers);
router.get("/get-my-year", protect,restrictedfor("student"),  getAllUsersfrom_myyear);
router.get("/students", protect, getAllStudents);
router.get("/teachers", protect, getAllteachers);
router.get("/companies", protect, getAllcompanies);
router.delete("/delete", protect, restrictedfor("admin"), deletuser);
router.get("/search", protect, searchForUser);

export default router;
