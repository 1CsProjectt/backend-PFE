import User  from "../models/UserModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import appError from "../utils/appError.js";
import { DATE, Op } from "sequelize";
import Student from "../models/studenModel.js";
import sequelize from "../config/database.js";
import teacher from "../models/teacherModel.js";
import Extern from "../models/externModel.js";
import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";




const createUser = catchAsync(async (req, res, next) => {
    const t = await sequelize.transaction(); 

    try {
        const { username, firstname, lastname, email, password, year, role, specialite, externName, phone, address, website, admin_level, permissions } = req.body;
        const fullname=firstname+' '+lastname
        const newUser = await User.create({
            username:fullname,
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

        if (role.toLowerCase() === 'extern') {
            if (!externName || !email) {
                await t.rollback();
                return next(new appError("Extern name and email are required for extern", 400));
            }

            const externData = {
                id: newUser.id,
                name: externName.trim(),
                phone: phone ? phone.trim() : null,
                address: address ? address.trim() : null,
                website: website ? website.trim() : null
            };

            await Extern.create(externData, { transaction: t });
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


export const updateUserByAdmin = catchAsync(async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
        const {
            email, 
            username,
            firstname,
            lastname,
            newEmail, 
            password,
            year,
            specialite,
            externName,
            phone,
            address,
            website,
            admin_level,
            permissions,role
        } = req.body;

        if (!email) {
            await t.rollback();
            return next(new appError("Current email is required to identify the user", 400));
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            await t.rollback();
            return next(new appError("User not found", 404));
        }

        
        if (newEmail && newEmail !== user.email) {
            const existingEmail = await User.findOne({ where: { email: newEmail } });
            if (existingEmail) {
                await t.rollback();
                return next(new appError("New email is already in use", 400));
            }
            user.email = newEmail;
        }
        const isSame = await bcrypt.compare(password, user.password);
        if (!isSame) {
        user.password = password;
        console.log('Password Changed At:', new Date());
        user.passwordChangedAt = new Date(); 
        }
        if (user.role!== role){
            user.role=role
        }
        if(user.username!==username){
            user.username=username
        }

        await user.save({ transaction: t });

        const currentRole = user.role.toLowerCase();

        if (currentRole === "student") {
            const student = await Student.findByPk(user.id);
            if (!student) {
                await t.rollback();
                return next(new appError("Student record not found", 404));
            }

            if (year) student.year = year.toUpperCase();

            if (["2CS", "3CS"].includes(year?.toUpperCase()) && !specialite) {
                await t.rollback();
                return next(new appError("Specialite is required for 2CS and 3CS students", 400));
            }

            student.specialite = specialite || student.specialite;
            student.firstname = firstname || student.firstname;
            student.lastname = lastname || student.lastname;
            
            await student.save({ transaction: t });

        } else if (currentRole === "teacher") {
            const Teacher = await teacher.findByPk(user.id);
            if (!Teacher) {
                await t.rollback();
                return next(new appError("Teacher record not found", 404));
            }

            Teacher.firstname = firstname || Teacher.firstname;
            Teacher.lastname = lastname || Teacher.lastname;


            await Teacher.save({ transaction: t });

        } else if (currentRole === "extern") {
            const extern = await Extern.findByPk(user.id);
            if (!extern) {
                await t.rollback();
                return next(new appError("extern record not found", 404));
            }

            extern.name = externName || extern.name;
            extern.phone = phone || extern.phone;
            extern.address = address || extern.address;
            extern.website = website || extern.website;


            await extern.save({ transaction: t });

        } else if (currentRole === "admin") {
            const admin = await Admin.findOne({ where: { id: user.id } });
            if (!admin) {
                await t.rollback();
                return next(new appError("Admin record not found", 404));
            }

            admin.firstname = firstname || admin.firstname;
            admin.lastname = lastname || admin.lastname;
            admin.admin_level = admin_level ?? admin.admin_level;
            admin.permissions = permissions ?? admin.permissions;

            await admin.save({ transaction: t });
        }

        await t.commit();

        res.status(200).json({
            status: "success",
            message: `User ${user.id} updated successfully`,
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

export const getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.findAll({
        include: [
            {
                model: Student,
                as: 'student',
                attributes: ['firstname', 'lastname', 'year', 'specialite']
            }
        ]
    });

    if (!users || users.length === 0) {
        return next(new appError('No users were found', 400));
    }

    res.json(users);
});


export const getAllStudents =catchAsync( async (req, res) => {
    
        const students = await Student.findAll({include:{
            model:User,
            as:"user",
            attributes:["email"]
        }});
        if (!students || students.length === 0) {
            return next(new appError('No students were found', 400));
        }
         
        res.json(students);
    
});

export const getAllteachers = catchAsync(async (req, res,next) => {
    
        const teachers = await teacher.findAll({include:{
            model:User,
            as: 'user',
            attributes:["email"]
        }});
        if (!teachers || teachers.length === 0) {
            return next(new appError('No teachers were found', 400));
        }
        res.json(teachers);
    
});

export const getAllcompanies =catchAsync( async (req, res) => {
    
        const companies = await Extern.findAll({include:{
            model:User,
            as:"user",
            attributes:["email"]
        }});
        if (!companies || companies.length === 0) {
            return next(new appError('No companies were found', 400));
        }
        
         
        res.json(companies);
    
});



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
                    { username: { [Op.like]: `%${query}%` } }, // PostgreSQL (use Op.like for MySQL/SQLite)
                    { email: { [Op.like]: `%${query}%` } }
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




export const searchForTeacher =catchAsync( async (searchTerm) => {
  
    const results = await teacher.findAll({
      where: {
        [Op.or]: [
          { firstname: { [Op.iLike]: `%${searchTerm}%` } },
          { lastname: { [Op.iLike]: `%${searchTerm}%` } },
          { name: { [Op.iLike]: `%${searchTerm}%` } },
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          where: {
            email: { [Op.iLike]: `%${searchTerm}%` }
          },
          required: false, 
          attributes: ['email', 'username'] 
        }
      ]
    });

    return results;
  
});


export {getUser};
export {createUser} ;
export {deletuser};


  