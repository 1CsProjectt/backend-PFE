import multer from 'multer'; 
import xlsx from  'xlsx';
import csv from 'csv-parser'; 
import fs from 'fs'; 
import { Readable } from 'stream';
import {catchAsync} from '../utils/catchAsync.js'; 
import AppError from '../utils/appError.js'; 
import Company from '../models/companyModel.js';
import Student from '../models/studenModel.js';
import User from '../models/UserModel.js';
import Admin from '../models/adminModel.js'; 
import teacher from '../models/teacherModel.js';
import sequelize from "../config/database.js";
// Configure Multer for file storage (e.g., in memory or to disk)
const upload = multer({ storage: multer.memoryStorage() });

export const createUsersFromFile = [
  upload.single('usersFile'), // field name in the form
  catchAsync(async (req, res, next) => {
    if (!req.file) {
      return next(new AppError('No file uploaded.', 400));
    }

    const results = {
      success: [],
      errors: [],
    };

    let usersData = [];

    try {
      if (
        req.file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        req.file.mimetype === 'application/vnd.ms-excel'
      ) {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        usersData = xlsx.utils.sheet_to_json(sheet);
      } else if (req.file.mimetype === 'text/csv') {
        usersData = await new Promise((resolve, reject) => {
          const data = [];
          const readable = new Readable();
          readable._read = () => {};
          readable.push(req.file.buffer);
          readable.push(null);

          readable
            .pipe(csv())
            .on('data', (row) => data.push(row))
            .on('end', () => resolve(data))
            .on('error', (error) => reject(error));
        });
      } else {
        return next(
          new AppError('Unsupported file type. Please upload an Excel or CSV file.', 400)
        );
      }
    } catch (parseError) {
      return next(new AppError(`Error parsing file: ${parseError.message}`, 500));
    }

    if (!usersData || usersData.length === 0) {
      return next(new AppError('The uploaded file is empty or could not be processed.', 400));
    }

    for (const userData of usersData) {
      const t = await sequelize.transaction();

      try {
        const { username, firstname, lastname, email, password, year, specialite } = userData;

        if (!username || !email || !password) {
          results.errors.push({
            user: username || email,
            error: 'Username, email, and password are required.',
          });
          await t.rollback();
          continue;
        }

        const newUser = await User.create(
          {
            username,
            email,
            password,
            role: 'student',
          },
          { transaction: t }
        );

        if (!year) {
          results.errors.push({ user: username, error: 'Year is required for student.' });
          await t.rollback();
          continue;
        }

        const studentData = {
          id: newUser.id,
          firstname,
          lastname,
          year: year.toString().toUpperCase(),
          specialite: ['2CS', '3CS'].includes(year.toString().toUpperCase())
            ? specialite?.toString().toUpperCase()
            : null,
        };

        if (['2CS', '3CS'].includes(studentData.year) && !studentData.specialite) {
          results.errors.push({
            user: username,
            error: 'Specialite is required for 2CS or 3CS students.',
          });
          await t.rollback();
          continue;
        }

        await Student.create(studentData, { transaction: t });

        await t.commit();
        results.success.push({ user: newUser.toJSON(), message: 'User created successfully.' });
      } catch (err) {
        await t.rollback();
        results.errors.push({
          user: userData.username || userData.email,
          error: err.message || 'An unknown error occurred.',
        });
      }
    }

    res.status(207).send({
      status: 'partial_success',
      message: `Processed ${usersData.length} users. ${results.success.length} succeeded, ${results.errors.length} failed.`,
      createdUsers: results.success,
      errors: results.errors,
    });
  }),
];