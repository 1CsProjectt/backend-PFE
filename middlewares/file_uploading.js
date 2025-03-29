import express from 'express';
import multer from'multer';
import path from'path';
import { fileURLToPath } from 'url'
import app from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const { fileURLToPath } = require('url');
// const app = require('./index.js');

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);




// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext); 
  }
});

const upload = multer({ storage });
export {upload};



//module.exports = {upload};

