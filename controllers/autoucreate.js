import multer from 'multer'; 
import xlsx from  'xlsx';
import csv from 'csv-parser'; 
import fs from 'fs'; 
import {catchAsync} from '../utils/catchAsync.js'; 
import AppError from '../utils/appError.js'; 
import Company from '../models/companyModel.js';
import Student from '../models/studenModel.js';
import User from '../models/UserModel.js';
import Admin from '../models/adminModel.js'; 
import teacher from '../models/teacherModel.js';
import sequelize from "../config/database.js";
// Configure Multer for file storage (e.g., in memory or to disk)
const uploadDir = path.join(__dirname, '../uploads'); // Adjust path if needed
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

export const createUsersFromFile = [
    upload.single('usersFile'), // 'usersFile' should be the name attribute of your file input in the form
    catchAsync(async (req, res, next) => {
        if (!req.file) {
            return next(new AppError('No file uploaded.', 400));
        }

        const results = {
            success: [],
            errors: [],
        };
        let usersData = [];

        // 1. Parse the file
        try {
            if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || req.file.mimetype === 'application/vnd.ms-excel') {
                const workbook = xlsx.readFile(req.file.path);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                usersData = xlsx.utils.sheet_to_json(sheet);
            } else if (req.file.mimetype === 'text/csv') {
                usersData = await new Promise((resolve, reject) => {
                    const data = [];
                    fs.createReadStream(req.file.path)
                        .pipe(csv())
                        .on('data', (row) => data.push(row))
                        .on('end', () => resolve(data))
                        .on('error', (error) => reject(error));
                });
            } else {
                fs.unlinkSync(req.file.path); // Clean up uploaded file
                return next(new AppError('Unsupported file type. Please upload an Excel or CSV file.', 400));
            }
            fs.unlinkSync(req.file.path); // Clean up uploaded file after parsing
        } catch (parseError) {
            if (req.file && req.file.path) fs.unlinkSync(req.file.path); // Clean up
            return next(new AppError(`Error parsing file: ${parseError.message}`, 500));
        }


        if (!usersData || usersData.length === 0) {
            return next(new AppError('The uploaded file is empty or could not be processed.', 400));
        }

        // 2. Iterate and create users
        for (const userData of usersData) {
            const t = await sequelize.transaction(); // Start a new transaction for each user

            try {
                // Map spreadsheet columns to your req.body fields
                // IMPORTANT: Adjust these mappings based on your Excel/CSV column headers
                const {
                    username, firstname, lastname, email, password,
                    year, role, specialite, companyName, phone,
                    address, website, admin_level, permissions
                } = userData;

                // Basic validation for core fields from file row
                if (!username || !email || !password || !role) {
                    results.errors.push({ user: username || email, error: "Username, email, password, and role are required." });
                    await t.rollback(); // Rollback this user's transaction
                    continue; // Skip to the next user
                }

                const newUser = await User.create({
                    username,
                    email,
                    password, // Remember to hash passwords in a real app!
                    role: role.toLowerCase(),
                }, { transaction: t });

                const currentRole = role.toLowerCase();

                if (currentRole === 'student') {
                    if (!year) {
                        results.errors.push({ user: username, error: "Year is required for student." });
                        await t.rollback();
                        continue;
                    }

                    let studentData = {
                        id: newUser.id,
                        firstname,
                        lastname,
                        year: year.toString().toUpperCase() // Ensure year is string before toUpperCase
                    };

                    if (['2CS', '3CS'].includes(year.toString().toUpperCase())) {
                        if (!specialite) {
                            results.errors.push({ user: username, error: "Specialite is required for 2CS or 3CS students." });
                            await t.rollback();
                            continue;
                        }
                        studentData.specialite = specialite.toString().toUpperCase();
                    } else {
                        studentData.specialite = null;
                    }
                    await Student.create(studentData, { transaction: t });
                } else if (currentRole === 'teacher') {
                    if (!firstname || !lastname) {
                        results.errors.push({ user: username, error: "Firstname and lastname are required for teacher." });
                        await t.rollback();
                        continue;
                    }
                    await teacher.create({ // Assuming 'Teacher' is your model name
                        id: newUser.id,
                        firstname,
                        lastname
                    }, { transaction: t });
                } else if (currentRole === 'company') {
                    if (!companyName || !email) { // Email for company might be different from user email
                        results.errors.push({ user: username, error: "Company name and user email are required for company role." });
                        await t.rollback();
                        continue;
                    }
                    await Company.create({
                        id: newUser.id,
                        name: companyName.trim(),
                        phone: phone ? phone.toString().trim() : null,
                        address: address ? address.toString().trim() : null,
                        website: website ? website.toString().trim() : null
                    }, { transaction: t });
                } else if (currentRole === 'admin') {
                    if (!firstname || !lastname) {
                        results.errors.push({ user: username, error: "Firstname & lastname are required for admin." });
                        await t.rollback();
                        continue;
                    }
                    await Admin.create({
                        id: newUser.id,
                        firstname,
                        lastname,
                        admin_level: admin_level || null,
                        permissions: permissions || null
                    }, { transaction: t });
                }
                // ... (add other role conditions similarly)

                await t.commit();
                results.success.push({ user: newUser.toJSON(), message: "User created successfully." });
                console.log("✅ User created:", newUser.toJSON());

            } catch (err) {
                await t.rollback();
                results.errors.push({ user: userData.username || userData.email, error: err.message || "An unknown error occurred." });
                console.error("❌ Error creating user:", userData.username || userData.email, err);
            }
        }

        res.status(207).send({ // 207 Multi-Status might be appropriate
            status: "partial_success", // Or "success" if all created, "failure" if all failed
            message: `Processed ${usersData.length} users. ${results.success.length} succeeded, ${results.errors.length} failed.`,
            createdUsers: results.success,
            errors: results.errors,
        });
    })
];