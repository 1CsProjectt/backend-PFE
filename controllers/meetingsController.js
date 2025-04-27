import { Op } from "sequelize";
import Meet from "../models/meetingModel.js";
import Team from "../models/groupModel.js";
import {catchAsync} from "../utils/catchAsync.js";

export const startNewMeeting = catchAsync(async (req, res, next) => {
    const { date, time, room,  Meeting_objectives_files} = req.body;
    const teamId = req.params.teamId; 
    const team = await Team.findByPk(teamId);
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
    });
    return res.status(201).json({
        status: `success starting new meeting for team ${team_name}`,
        data: {
            mymeet,
        },
    });

})








    
