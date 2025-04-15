import express from 'express';
import { protect,restrictedfor } from "../middlewares/authmiddleware.js";
import { checkEventTime } from '../controllers/eventcontroller.js';
import {uploadFiles} from '../middlewares/file_uploading.js'
import {
  getAllPFE,
  createPFE,
  deletePFE,
  deletePFEforcreator,
  displayPFE,
  displaythisyearsPFE,
  downloadfile,
  displayPFEforstudents,
  addSupervisor,
  validatePFE,
  getPfesBySpecialization,
  searchForPfes,
  getIsiPfes,
  getIasdPfes
  ,getSiwPfes,
  getMyPfe,
  displayvalidePFE
 } from "../controllers/pfecontroller.js";


//  const express = require('express');
// const { protect, restrictedfor } = require('../controllers/authentification.js');
// const { checkEventTime } = require('../controllers/eventcontroller.js');
// const {
//   createpfe,
//   deletePFE,
//   deletePFEforcreator,
//   displayPFE,
//   displaythisyearsPFE,
//   downloadfile,
//   uploadfile,
//   displayPFEforstudents,
//   addSupervisor,
//   validatePFE,
//   displayAllPFE,
// } = require("../controllers/pfecontroller.js");





const router = express.Router();
 // ✅ Upload PFE file
router.post(
    '/depositPFE',
    protect,
    restrictedfor('teacher', 'company'),
    uploadFiles, 
    createPFE
  );
  

  // ✅ Delete PFE (only the creator can delete)
  router.delete("/delete/:id", protect, deletePFEforcreator);
  
  // ✅ Admin can delete any PFE
  router.delete("/admin/delete/:id", protect, restrictedfor("admin"), deletePFE);
  
  // ✅ Download PFE file
  router.get("/download/:filename", downloadfile);
  
  // ✅ Display all PFEs (teacher & company view)
  router.get("/", protect, restrictedfor("teacher","company"), getAllPFE);
  
  // ✅ Display unvalidated PFEs (for validation)
  router.get("/pending",protect,restrictedfor('admin'), displayPFE);
  //display valide PFEs for admin
  router.get("/validpfe",protect,restrictedfor('admin'), displayvalidePFE);
  
  // ✅ Display validated PFEs for students (based on their year and specialite)
  router.get("/for-students", protect, restrictedfor("student"), displayPFEforstudents);
  
  // ✅ Display this year's PFEs ex(2CS) 
  router.get("/this-year", protect, displaythisyearsPFE);
  
  // ✅ Add Supervisor to a PFE
  router.post("/:pfeId/add-supervisor", protect, restrictedfor("teacher", "company"), addSupervisor);
  
  // ✅ Validate a PFE (only admin can validate)
  router.patch("/:id/validate", protect, restrictedfor("admin"), validatePFE);

  router.get("/my-pfes", protect, getMyPfe);

  
router.get("/getPfes/:specialization", getPfesBySpecialization);
router.get("/searchForPfes", searchForPfes);
router.get('/getIsiPfes', getIsiPfes);
router.get('/getIasdPfes', getIasdPfes);
router.get('/getSiwPfes', getSiwPfes);
  
  export default router;
  

  //module.exports = router;