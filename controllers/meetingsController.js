import { Op } from "sequelize";
import Meet from "../models/meetingModel.js";
import Team from "../models/groupModel.js";
import {catchAsync} from "../utils/catchAsync.js";
import appError from "../utils/appError.js";


export const startNewMeeting = catchAsync(async (req, res, next) => {
    const { date, time, room,  Meeting_objectives_files} = req.body;
    const teamId = req.params.teamId;
    const { id } = req.user; // Assuming the user ID is available in req.user 
    const supervisorId = id; // Assuming the supervisor ID is available in req.user
    const isSupervisorOfTeam = await Team.findOne({
        where: {
            id: teamId,
            supervisorId: id,
        },
    });
    if (!isSupervisorOfTeam) {
        return next(new appError("You are not authorized to start a meeting for this team", 403));  
    }
    // Check if the team exists




    const team = await Team.findByPk(teamId);
    const priviousMeet = await Meet.findOne({
        where: {
            teamId: teamId,
            nextMeeting: true,
        },
    });

    if (priviousMeet) {
        await priviousMeet.update({
            nextMeeting: false,
        });
    }
    if (!team) {
        return next(new appError("Team not found", 404));
    }
    const team_name = team.groupName;

    const mymeet = await Meet.create({
        date,
        time,
        room,
        Meeting_objectives_files,
        teamId, 
        supervisorId: supervisorId,
        nextMeeting: true,
    });

    return res.status(201).json({
        status: `success starting new meeting for team ${team_name}`,
        data: {
            mymeet,
        },
    });

});

export const getAllMeetings = catchAsync(async (req, res, next) => {
    const meetings = await Meet.findAll({
        where: {
            teamId: req.params.teamId,
        },
    });
    if (!meetings) {
        return next(new appError("No meetings found for this team", 404));
    }
    return res.status(200).json({
        status: "success",
        data: {
            meetings,
        },
    });
});

export const cancelMeeting = catchAsync(async (req, res, next) => {
    const meetingId = req.params.meetingId;
    const meeting = await Meet.findByPk(meetingId);
    if (!meeting) {
        return next(new appError("Meeting not found", 404));
    }
    await meeting.destroy();
    return res.status(204).json({
        status: "success",
        message: "Meeting deleted successfully",
    });
})

export const getNextMeet = catchAsync(async (req, res, next) => {
    const teamId = req.params.teamId;
    const nextMeeting = await Meet.findOne({
        where: {
            teamId: teamId,
            nextMeeting: true,
        }
    });
    if (!nextMeeting) {
        return next(new appError("No upcoming meetings found for this team", 404));
    }
    return res.status(200).json({
        status: "success",
        data: {
            nextMeeting,
        },
    });
})


export const updateMeeting = catchAsync(async (req, res, next) => {
    const meetingId = req.params.meetingId;
    const { date, time, room, Meeting_objectives_files } = req.body;
    const meeting = await Meet.findByPk(meetingId);
    if (!meeting) {
        return next(new appError("Meeting not found", 404));
    }
    await meeting.update({
        date,
        time,
        room,
        Meeting_objectives_files,
    });
    return res.status(200).json({
        status: "success",
        data: {
            meeting,
        },
    });
}) 


export const update_Work_Status = catchAsync(async (req, res, next) => {
    const meetingId = req.params.meetingId;
    const { work_Status } = req.body;
    const meeting = await Meet.findByPk(meetingId);
    if (!meeting) {
        return next(new appError("Meeting not found", 404));
    }
    await meeting.update({
        work_Status,
    });
    return res.status(200).json({
        status: `success updating work status to ${work_Status}`,
        data: {
            meeting,
        },
    });
})







    
