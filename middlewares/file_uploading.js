import multer from "multer";
import path from "path";

// Storage for PDFs
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store PDFs in 'uploads/'
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Storage for Photos
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "photos/"); // Store photos in 'photos/'
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Multer configuration for both PDF and Photos
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "pdfFile") {
        cb(null, "uploads/"); // PDFs go to 'uploads/'
      } else if (file.fieldname === "photo") {
        cb(null, "photos/"); // Photos go to 'photos/'
      } else {
        cb(new Error("Unexpected field"), false);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedPdfTypes = ["application/pdf"];
    const allowedPhotoTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (file.fieldname === "pdfFile" && allowedPdfTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if (file.fieldname === "photo" && allowedPhotoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
});

// Middleware to accept multiple fields
const uploadFiles = upload.fields([
  { name: "pdfFile", maxCount: 1 },
  { name: "photo", maxCount: 1 },
]);

export { uploadFiles };
