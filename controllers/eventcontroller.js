import Event from "../models/eventModel.js";
import appError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import Student from "../models/studenModel.js";
import app from "../index.js";
import { Op } from "sequelize";
import Notification from "../models/notificationModel.js";
import Teacher from "../models/teacherModel.js";



const setEvent = catchAsync(async (req, res, next) => {
    let { name, startTime, endTime, maxNumber, targeted = 'students' } = req.body;
    const year = req.body.year?.toUpperCase();

    const allowedNames = ['PFE_SUBMISSION', 'SOUTENANCE', 'TEAM_CREATION', 'PFE_ASSIGNMENT', 'WORK_STARTING'];
    const allowedYears = ['2CP', '1CS', '2CS', '3CS'];
    const allowedTargets = ['teachers', 'students'];

    if (!allowedNames.includes(name)) {
        return next(new appError("Invalid event name", 400));
    }

    if (name === 'PFE_SUBMISSION') {
        targeted = 'teachers';
    }

    if (!allowedTargets.includes(targeted)) {
        return next(new appError("Invalid targeted value", 400));
    }

    if (new Date(startTime) >= new Date(endTime)) {
        return next(new appError("Start time must be before end time", 400));
    }

    if (name === "TEAM_CREATION" && (maxNumber === undefined || isNaN(maxNumber) || maxNumber <= 0)) {
        return next(new appError("Max number is required and must be a positive number for TEAM_CREATION", 400));
    }

    if (targeted === 'students') {
        if (!allowedYears.includes(year)) {
            return next(new appError("Invalid academic year", 400));
        }
    }

    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);
    parsedStartTime.setUTCHours(0, 0, 0, 0);
    parsedEndTime.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = new Date(Date.UTC(currentYear, 0, 1)); 
    const yearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59)); 

    if (targeted === 'students') {
        const conditions = { targeted, year };

        if (name === "PFE_ASSIGNMENT") {
            const pfeSubmission = await Event.findOne({
                where: {
                    name: "PFE_SUBMISSION",
                    targeted: 'teachers',
                    createdAt: { [Op.between]: [yearStart, yearEnd] }
                }
            });

            const teamCreation = await Event.findOne({
                where: {
                    ...conditions,
                    name: "TEAM_CREATION",
                    createdAt: { [Op.between]: [yearStart, yearEnd] }
                }
            });

            if (!pfeSubmission || !teamCreation) {
                return next(new appError(`TEAM_CREATION for ${year} and global PFE_SUBMISSION must exist before creating PFE_ASSIGNMENT`, 400));
            }

            if (new Date(pfeSubmission.endTime) > now) {
                return next(new appError(`Global PFE_SUBMISSION must be finished before creating PFE_ASSIGNMENT`, 400));
            }

            if (new Date(teamCreation.endTime) > now) {
                return next(new appError(`TEAM_CREATION for ${year} must be finished before creating PFE_ASSIGNMENT`, 400));
            }
        }

        if (name === "WORK_STARTING") {
            const assignmentEvent = await Event.findOne({
                where: {
                    ...conditions,
                    name: "PFE_ASSIGNMENT",
                    createdAt: { [Op.between]: [yearStart, yearEnd] }
                }
            });

            if (!assignmentEvent) {
                return next(new appError(`PFE_ASSIGNMENT must exist for ${year} before creating WORK_STARTING`, 400));
            }

            if (new Date(assignmentEvent.endTime) > now) {
                return next(new appError(`PFE_ASSIGNMENT for ${year} must be finished before creating WORK_STARTING`, 400));
            }

            const existingTeacherWorkStart = await Event.findOne({
                where: {
                    name,
                    targeted: "teachers",
                    createdAt: { [Op.between]: [yearStart, yearEnd] }
                }
            });

            if (!existingTeacherWorkStart) {
        await Event.create({
            name,
            targeted: "teachers",
            startTime: parsedStartTime,
            endTime: parsedEndTime,
        });
        } else {
        const existingEndTime = new Date(existingTeacherWorkStart.endTime);
        const laterEndTime = parsedEndTime > existingEndTime ? parsedEndTime : existingEndTime;

        await existingTeacherWorkStart.update({
            endTime: laterEndTime,
        });
        }

        }
                if (name === "SOUTENANCE") {
            const workStartingEvent = await Event.findOne({
                where: {
                    ...conditions,
                    name: "WORK_STARTING",
                    createdAt: { [Op.between]: [yearStart, yearEnd] }
                }
            });

            if (!workStartingEvent) {
                return next(new appError(`WORK_STARTING must exist for ${year} before creating SOUTENANCE`, 400));
            }

            if (new Date(workStartingEvent.endTime) > now) {
                return next(new appError(`WORK_STARTING for ${year} must be finished before creating SOUTENANCE`, 400));
            }

            const existingTeacherSoutenance = await Event.findOne({
                where: {
                    name,
                    targeted: "teachers",
                    year,
                    createdAt: { [Op.between]: [yearStart, yearEnd] }
                }
            });

            if (!existingTeacherSoutenance) {
                await Event.create({
                    name,
                    targeted: "teachers",
                    year,
                    startTime: parsedStartTime,
                    endTime: parsedEndTime
                });
            }
        }

    }

    const existingEvent = await Event.findOne({
        where: {
            name,
            targeted,
            ...(targeted === 'students' ? { year } : {}),
            createdAt: { [Op.between]: [yearStart, yearEnd] }
        }
    });

    if (existingEvent) {
        return next(new appError(`A "${name}" session already exists for ${targeted}${year ? " - " + year : ""}.`, 400));
    }

    const io = req.app.get("socketio");
    io.emit("notification", { message: `New event posted: ${name}` });

    const finalMaxNumber = name === "TEAM_CREATION" && ['2CS', '3CS'].includes(year) ? 2 : maxNumber;

    const event = await Event.create({
        name,
        year: targeted === 'students' ? year : null,
        targeted,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        maxNumber: name === "TEAM_CREATION" ? finalMaxNumber : null
    });
    let usersToNotify = [];
    let notifications = [];
    
    if (name === 'PFE_SUBMISSION') {
      const teachers = await Teacher.findAll();
      notifications = teachers.map(teacher => ({
        user_id: teacher.id,
        type: "session-created",
        content: `A new session '${name}' has been scheduled for PFE submission.`,
        is_read: false,
        metadata: {
          eventId: event.id,
          eventName: name,
          startTime: parsedStartTime,
          endTime: parsedEndTime
        }
      }));
    } else if (name === 'TEAM_CREATION') {
      const students = await Student.findAll({ where: { year } });
      notifications = students.map(student => ({
        user_id: student.id,
        type: "session-created",
        content: `Team creation session has started for your year (${year}).`,
        is_read: false,
        metadata: {
          eventId: event.id,
          eventName: name,
          year,
          startTime: parsedStartTime,
          endTime: parsedEndTime
        }
      }));
    } else if (name === 'PFE_ASSIGNMENT') {
      const students = await Student.findAll({ where: { year } });
      const teachers = await Teacher.findAll();
    
      const studentNotifications = students.map(student => ({
        user_id: student.id,
        type: "session-created",
        content: `PFE assignment session has started for your year (${year}).`,
        is_read: false,
        metadata: {
          eventId: event.id,
          eventName: name,
          year,
          startTime: parsedStartTime,
          endTime: parsedEndTime
        }
      }));
    
      const teacherNotifications = teachers.map(teacher => ({
        user_id: teacher.id,
        type: "session-created",
        content: `PFE assignment session has started for ${year} students.`,
        is_read: false,
        metadata: {
          eventId: event.id,
          eventName: name,
          year,
          startTime: parsedStartTime,
          endTime: parsedEndTime
        }
      }));
    
      notifications = [...studentNotifications, ...teacherNotifications];
    } else if (name === 'WORK_STARTING') {
      const students = await Student.findAll({ where: { year } });
      const teachers = await Teacher.findAll();
    
      const studentNotifications = students.map(student => ({
        user_id: student.id,
        type: "session-created",
        content: `Work has officially started for your PFE (${year}).`,
        is_read: false,
        metadata: {
          eventId: event.id,
          eventName: name,
          year,
          startTime: parsedStartTime,
          endTime: parsedEndTime
        }
      }));
    
      const teacherNotifications = teachers.map(teacher => ({
        user_id: teacher.id,
        type: "session-created",
        content: `Work has officially started for ${year} students.`,
        is_read: false,
        metadata: {
          eventId: event.id,
          eventName: name,
          year,
          startTime: parsedStartTime,
          endTime: parsedEndTime
        }
      }));
    
      notifications = [...studentNotifications, ...teacherNotifications];
    }
    
if (notifications.length > 0) {
  await Notification.bulkCreate(notifications);
}


    res.status(201).json({
        status: "success",
        message: "SESSION created successfully",
        event
    });
});



export const deleteEvent = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // 1) Find the event by its primary key
    const event = await Event.findByPk(id);
    if (!event) {
        return next(new appError('No event found with that ID', 404));
    }

    // 2) Delete the event from the database
    await event.destroy();

    // 3) Notify clients and send response
    const io = req.app.get("socketio");
    io.emit("notification", { message: `Event deleted: ${event.name}` });

    res.status(204).json({
        status: 'success',
        data: null
    });
});





export const updateEvent = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { startTime, endTime, maxNumber } = req.body;

    // 1) Validate ID and fetch the event
    const event = await Event.findByPk(id);
    if (!event) {
        return next(new appError("Event not found", 404));
    }

    // 2) Parse and validate date range
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);
    parsedStartTime.setUTCHours(0, 0, 0, 0);
    parsedEndTime.setUTCHours(0, 0, 0, 0);

    if (parsedStartTime >= parsedEndTime) {
        return next(new appError("Start time must be before end time", 400));
    }

    // 3) Special validation for TEAM_CREATION
    if (event.name === "TEAM_CREATION") {
        if (maxNumber === undefined || isNaN(maxNumber) || maxNumber <= 0) {
            return next(new appError("Max number must be a positive number", 400));
        }
        event.maxNumber = maxNumber;
    }

    // 4) Update values
    event.startTime = parsedStartTime;
    event.endTime = parsedEndTime;

    await event.save();

    // 5) Notify via socket
    const io = req.app.get("socketio");
    io.emit("notification", { message: `Event updated: ${event.name}` });

    res.status(200).json({
        status: "success",
        message: "Event updated successfully",
        event
    });
});





const checkEventTime = (eventName, targetedParam = null) => {
    return catchAsync(async (req, res, next) => {
        let year = null;
        let targeted = targetedParam;

        if (!req.user || !req.user.role) {
            return next(new appError("Unauthorized: No user found in request", 401));
        }

        
        if (!targeted) {
            if (req.user.role === "student") {
                targeted = "students";
                const studentData = await Student.findOne({ where: { id: req.user.id } });

                if (!studentData) {
                    return next(new appError("Student record not found", 404));
                }

                year = studentData.year?.toUpperCase();
                if (!year) {
                    return next(new appError('Student year is missing', 400));
                }

            } else if (["teacher", "extern"].includes(req.user.role)) {
                targeted = "teachers";
            } else {
                return next(new appError("Invalid user role", 400));
            }
        } else if (targeted === "students") {
            const studentData = await Student.findOne({ where: { id: req.user.id } });

            if (!studentData) {
                return next(new appError("Student record not found", 404));
            }

            year = studentData.year?.toUpperCase();
            if (!year) {
                return next(new appError('Student year is missing', 400));
            }
        }

        console.log(`Event check -> Role: ${req.user.role}, Targeted: ${targeted}, Year: ${year || "N/A"}`);

        let eventQuery = {
            name: eventName,
            targeted
        };

        if (targeted === "students") {
            eventQuery.year = year;
        }

        const event = await Event.findOne({ where: eventQuery });

        if (!event) {
            return next(new appError(`SESSION "${eventName}" is not configured yet.`, 403));
        }

        const now = new Date();

        if (now < event.startTime) {
            return next(new appError(`SESSION "${eventName}" has not started yet.`, 403));
        }

        if (now > event.endTime) {
            return next(new appError(`SESSION "${eventName}" has ended.`, 403));
        }

        if (eventName === "TEAM_CREATION") {
            req.maxnum = event.maxNumber;
        }

        next();
    });
};



export const getAllEvents = catchAsync(async (req, res, next) => {
    const events = await Event.findAll(); 
  
    if (!events) {
      return res.status(404).json({
        status: 'fail',
        message: 'No events found',
      });
    }
  
    return res.status(200).json({
      status: 'success',
      data: {
        events,
      },
    });
  });



export const getCurrentSession = catchAsync(async (req, res, next) => {
  const userId=req.user.id;
  const rolee=req.user.role;    
  console.log(rolee)   
  let targeted = null;
  let year = null;

  if (rolee === 'teacher' || rolee === 'extern') {
    targeted = 'teachers';
  } else if (rolee === 'student') {
    targeted = 'students';

    const student = await Student.findOne({ where: { id:userId } });
    if (!student) {
      return next(new appError('Student profile not found', 404));
    }
    year = student.year;    
  } else if(rolee==='admin')
     {
        res.locals.currentSessions='NORMAL_SESSION'
  }else{
    return next(new appError('Unrecognized user role', 400));
  }

  const now = new Date();
  const where = {
    targeted,
    startTime: { [Op.lte]: now },
    endTime:   { [Op.gte]: now }
  };
  if (targeted === 'students') {
    where.year = year;
  }
  console.log(where)

  const currentEvents = await Event.findAll({ where });
  console.log("this is the currentEvents =================================>",currentEvents)

  if (!currentEvents.length) {
    res.locals.currentSessions={"name":"NORMAL_SESSION"}
  }else{
  res.locals.currentSessions = currentEvents;
  }
  next();
});


export{checkEventTime,setEvent};




