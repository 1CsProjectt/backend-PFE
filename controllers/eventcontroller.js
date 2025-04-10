import Event from "../models/eventModel.js";
import appError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import Student from "../models/studenModel.js";



// const Event = require("../models/eventModel.js");
// const appError = require("../utils/appError.js");
// const { catchAsync } = require("../utils/catchAsync.js");
// const Student = require("../models/studenModel.js");



const setEvent = catchAsync(async (req, res, next) => {
    const { name, startTime, endTime, maxNumber } = req.body;
    const year = req.body.year?.toUpperCase();

    const allowedNames = ['PFE_SUBMISSION', 'PFE_VALIDATION', 'TEAM_CREATION', 'PFE_ASSIGNMENT', 'WORK_STARTING'];
    const allowedYears = ['2CP', '1CS', '2CS', '3CS'];

    if (!allowedNames.includes(name)) {
        return next(new appError("Invalid event name", 400));
    }

    if (!allowedYears.includes(year)) {
        return next(new appError("Invalid academic year", 400));
    }

    if (new Date(startTime) >= new Date(endTime)) {
        return next(new appError("Start time must be before end time", 400));
    }

    if (name === "TEAM_CREATION" && (maxNumber === undefined || isNaN(maxNumber) || maxNumber <= 0)) {
        return next(new appError("Max number is required and must be a positive number for TEAM_CREATION", 400));
    }

    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);
    parsedStartTime.setUTCHours(0, 0, 0, 0);
    parsedEndTime.setUTCHours(0, 0, 0, 0);

    const io = req.app.get("socketio");
    io.emit("notification", { message: `New event posted: ${name}` });

    const existingEvent = await Event.findOne({ where: { year } });

    if (existingEvent) {
        const existingEventEndTime = new Date(existingEvent.endTime);
        existingEventEndTime.setUTCHours(0, 0, 0, 0); 
        
        if (existingEventEndTime > new Date()) {
            return next(new appError(`An event is already active for ${year} until ${existingEvent.endTime}`, 400));
        }
    }

    
    let event;
    if (existingEvent) {
        existingEvent.name = name;
        existingEvent.startTime = parsedStartTime;
        existingEvent.endTime = parsedEndTime;
        existingEvent.maxNumber = name === "TEAM_CREATION" ? maxNumber : null;
        await existingEvent.save();
        event = existingEvent;
    } else {
        // Create new event
        event = await Event.create({
            name,
            year,
            startTime: parsedStartTime,
            endTime: parsedEndTime,
            maxNumber: name === "TEAM_CREATION" ? maxNumber : null
        });
    }

    res.status(200).json({
        status: "success",
        message: existingEvent ? "SESSION updated successfully" : "SESSION created successfully",
        event
    });
});







export const updateEvent = catchAsync(async (req, res, next) => {
    const { name, year, startTime, endTime, maxNumber } = req.body;

    if (!name || !year) {
        return next(new appError("Event name and year are required", 400));
    }

    const event = await Event.findOne({ where: { name, year: year.toUpperCase() } });

    if (!event) {
        return next(new appError("Event not found", 404));
    }

    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);
    parsedStartTime.setUTCHours(0, 0, 0, 0);
    parsedEndTime.setUTCHours(0, 0, 0, 0);

    if (parsedStartTime >= parsedEndTime) {
        return next(new appError("Start time must be before end time", 400));
    }

    // Apply updates
    event.startTime = parsedStartTime;
    event.endTime = parsedEndTime;

    if (name === "TEAM_CREATION") {
        if (maxNumber === undefined || isNaN(maxNumber) || maxNumber <= 0) {
            return next(new appError("Max number must be a positive number", 400));
        }
        event.maxNumber = maxNumber;
    }

    await event.save();

    const io = req.app.get("socketio");
    io.emit("notification", { message: `Event updated: ${name}` });

    res.status(200).json({
        status: "success",
        message: "Event updated successfully",
        event
    });
});




 const checkEventTime = (eventName) => {
    return catchAsync( async (req, res, next) => {
        
            let year = null;

            if (!req.user || !req.user.role) {
                return next(new appError("Unauthorized: No user found in request", 401));
            }

            if (req.user.role === "student") {
                const studentData = await Student.findOne({ where: { id: req.user.id } });
                if (!studentData) {
                    return next(new appError("Student record not found", 404));
                }

                year = studentData.year.toUpperCase();
                if (!year) {
                    return next(new appError('Student year is missing', 400));
                }
            } else if (["teacher", "company"].includes(req.user.role)) {
                if (!req.body.year) {
                    return next(new appError("Year is required for teachers and companies", 400));
                }
                year = req.body.year.toUpperCase();
            } else {
                return next(new appError("Invalid user role", 400));
            }

            console.log(`Year resolved as: ${year}`);

            
            const event = await Event.findOne({ where: { name: eventName, year } });

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

export{checkEventTime,setEvent};

// module.exports={
//     checkEventTime,setEvent
// };


