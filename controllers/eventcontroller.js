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

    const eventData = {
        startTime: parsedStartTime,
        endTime: parsedEndTime,
    };

    if (name === "TEAM_CREATION") {
        eventData.maxNumber = maxNumber; 
    }
    const io = req.app.get("socketio");
    io.emit("notification", { message: `New event posted: ${name}` });

    const [event, created] = await Event.findOrCreate({
        where: { name, year },
        defaults: eventData
    });

    if (!created) {
        event.startTime = parsedStartTime;
        event.endTime = parsedEndTime;
        if (name === "TEAM_CREATION") {
            event.maxNumber = maxNumber;
        }
        await event.save();
    }

    res.status(200).json({
        status: "success",
        message: created ? "SESSION created successfully" : "SESSION updated successfully",
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


