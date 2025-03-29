import User  from "../models/UserModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import appError from "../utils/appError.js";
import { Op } from "sequelize";
import Student from "../models/studenModel.js";
import sequelize from "../config/database.js";
import teacher from "../models/teacherModel.js";
import Company from "../models/companyModel.js";
import Admin from "../models/adminModel.js";





const createUser = catchAsync(async (req, res, next) => {
    const t = await sequelize.transaction(); 

    try {
        const { username, firstname, lastname, email, password, year, role, specialite, companyName, phone, address, website, admin_level, permissions } = req.body;

        const newUser = await User.create({
            username,
            email,
            password,
            role: role.toLowerCase(),
        }, { transaction: t });

        if (role.toLowerCase() === 'student') {
            if (!year) {
                await t.rollback();
                return next(new appError("Year is required for student", 400));
            }

            let studentData = {
                id: newUser.id,
                firstname,
                lastname,
                year: year.toUpperCase()
            };

            if (['2CS', '3CS'].includes(year.toUpperCase())) {
                if (!specialite) {
                    await t.rollback();
                    return next(new appError("Specialite is required for 2CS or 3CS students.", 400));
                }
                studentData.specialite = specialite.toUpperCase();
            } else {
                studentData.specialite = null;
            }

            await Student.create(studentData, { transaction: t });
        }

        if (role.toLowerCase() === 'teacher') {
            if (!firstname || !lastname) {
                await t.rollback();
                return next(new appError("Firstname and lastname are required for teacher", 400));
            }

            const teacherData = {
                id: newUser.id,
                firstname,
                lastname
            };

            await teacher.create(teacherData, { transaction: t });
        }

        if (role.toLowerCase() === 'company') {
            if (!companyName || !email) {
                await t.rollback();
                return next(new appError("Company name and email are required for company", 400));
            }

            const companyData = {
                id: newUser.id,
                name: companyName.trim(),
                phone: phone ? phone.trim() : null,
                address: address ? address.trim() : null,
                website: website ? website.trim() : null
            };

            await Company.create(companyData, { transaction: t });
        }

        if (role.toLowerCase() === 'admin') {
            if (!firstname || !lastname ) {
                await t.rollback();
                return next(new appError("Firstname & lastname are required for admin", 400));
            }

            const adminData = {
                id: newUser.id,
                firstname,
                lastname,
                admin_level: admin_level || null,
                permissions: permissions || null
            };

            await Admin.create(adminData, { transaction: t });
        }

        await t.commit(); 
        console.log("✅\n" + newUser.toJSON());
        res.send({
            status: "success",
            user: newUser,
        });

    } catch (err) {
        await t.rollback(); 
        return next(err);
    }
});


 const updateUser = catchAsync(async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
        const { firstname, lastname, year, specialite, name, industry, phone, address, website, admin_level, permissions } = req.body;

        // Ensure the user exists
        const user = await User.findByPk(req.user.id);
        if (!user) {
            await t.rollback();
            return next(new appError("User not found", 404));
        }

        if (user.role === "student") {
            const student = await Student.findByPk(user.id);
            if (!student) {
                await t.rollback();
                return next(new appError("Student record not found", 404));
            }

            if (year) student.year = year.toUpperCase();
            if (["2CS", "3CS"].includes(year?.toUpperCase()) && !specialite) {
                await t.rollback();
                return next(new appError("Specialite is required for 2CS and 3CS", 400));
            }
            student.specialite = specialite || null;
            student.firstname = firstname || student.firstname;
            student.lastname = lastname || student.lastname;
            student.phone = phone || student.phone;
            student.address = address || student.address;

            await student.save({ transaction: t });

        } else if (user.role === "teacher") {
            const teacher = await teacher.findByPk(user.id);
            if (!teacher) {
                await t.rollback();
                return next(new appError("Teacher record not found", 404));
            }

            teacher.firstname = firstname || teacher.firstname;
            teacher.lastname = lastname || teacher.lastname;
            teacher.phone = phone || teacher.phone;
            teacher.address = address || teacher.address;

            await teacher.save({ transaction: t });

        } else if (user.role === "company") {
            const company = await Company.findByPk(user.id);
            if (!company) {
                await t.rollback();
                return next(new appError("Company record not found", 404));
            }

            company.name = name || company.name;
            company.industry = industry || company.industry;
            company.phone = phone || company.phone;
            company.address = address || company.address;
            company.website = website || company.website;

            await company.save({ transaction: t });
        } else if (user.role === "admin") {
            const admin = await Admin.findOne({ where: { user_id: user.id } });
            if (!admin) {
                await t.rollback();
                return next(new appError("Admin record not found", 404));
            }

            admin.firstname = firstname || admin.firstname;
            admin.lastname = lastname || admin.lastname;
            admin.admin_level = admin_level || admin.admin_level;
            admin.permissions = permissions || admin.permissions;

            await admin.save({ transaction: t });
        }

        await t.commit();

        res.status(200).json({
            status: "success",
            message: "User updated successfully",
        });

    } catch (error) {
        await t.rollback();
        return next(error);
    }
});

const getUser = catchAsync(async (req, res, next) => {
    
        const id = req.params.id;

        if (isNaN(id)) {
            return next(new appError(`Invalid ID format: "${id}" must be a number`, 400));
        }

        const user = await User.findOne({ where: { id: parseInt(id) } });

        if (!user) {
            return next(new appError('User not found', 404));
        }
 
        res.status(200).json({ status: 'success', data: user });
   
});


export const getAllUsersfrom_myyear = catchAsync(async (req, res, next) => {
    console.log(req.user);

    const currentUser = req.user; 
    const currentStudent = await Student.findOne({ where: { id: currentUser.id } });

    if (!currentUser || !currentStudent) {
        return next(new appError('Current user or student record not found', 400));
    }

    const year = currentStudent.year;

    const allUsers = await User.findAll({
        include: [{
            model: Student,
            where: { year },
        }],
        where: {
            id: { [Op.ne]: currentUser.id }
        }
    });

    if (allUsers.length > 0) {
        console.log('Found users: ', allUsers);
        res.send({
            status: "success",
            users: allUsers
        });
    } else {
        next(new appError('No users found for the same year', 400));
    }
});

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
         
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};
export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.findAll({include:{
            model:User,
            as:"user",
            attributes:["email"]
        }});
         
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};

export const getAllteachers = async (req, res) => {
    try {
        const teachers = await Teacher.findAll({include:{
            model:User,
            attributes:["email"]
        }});
         
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};

export const getAllcompanies = async (req, res) => {
    try {
        const companies = await Company.findAll({include:{
            model:User,
            attributes:["email"]
        }});
         
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};



   const deletuser = catchAsync(async (req, res, next) => {
    const { id, email} = req.body;

    if (!id && !email) {
        return next(new appError("Please provide either a user ID or a email to delete.", 400));
    }

    const whereClause = {};
    if (id) whereClause.id = id;
    if (email) whereClause.email = email;

    const deletedCount = await User.destroy({ where: whereClause });

    if (deletedCount === 0) {
        return next(new appError("No user found matching the criteria.", 404));
    }

    res.status(200).json({
        status: "success",
        message: `${deletedCount} user(s) deleted.`
    });
});





export const searchForUser = catchAsync( async (req, res) => {
        const { query } = req.query;
        console.log(query);

        if (!query) {
            return res.status(400).json({ error: "Query parameter (username or email) is required" });
        }

        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { username: { [Op.iLike]: `%${query}%` } }, // PostgreSQL (use Op.like for MySQL/SQLite)
                    { email: { [Op.iLike]: `%${query}%` } }
                ]
            }
        });

        if (!users.length) {
            return res.status(404).json({ message: "No users found" });
        }

        return res.status(200).json({
            message: "Users found successfully",
            users
        });

    
});

export {getUser};
export {createUser} ;
export {deletuser};
export {updateUser};

  