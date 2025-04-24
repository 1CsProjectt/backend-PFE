import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const sanitizedFilename = file.originalname
    .replace(/\s+/g, '_') // 
    .replace(/[^\w.-]/g, '');
    return {
      folder: 'pfe-uploads',
      resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
      public_id: `${Date.now()}-${file.originalname}` 

    };
  },
});

export const upload = multer({ storage });
