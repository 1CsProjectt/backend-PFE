import { Op } from "sequelize";
import Meeting from './meeting.js';


export const startNewMeeting = catchAsync(async (req, res, next) => {
    const { date, time, room,  Meeting_objectives_files, Support_files, Team_deliverables_files, My_review_for_deliverables_files, Meeting_pv_files } = req.body;
    const teamId = req.params.teamId; 
    const team = await Team.findByPk(teamId);
    if (!team) {
        return next(new appError("Team not found", 404));
    }
    const team_name = team.groupName;
    const meeting = await Meeting.create({
        date,
        time,
        room,
        Meeting_objectives_files,
        Support_files,
        Team_deliverables_files,
        My_review_for_deliverables_files,
        Meeting_pv_files,
        teamId, // Assuming you have a foreign key in the Meeting model
    });
    return res.status(201).json({
        status: `success starting new meeting for team ${team_name}`,
        data: {
            meeting,
        },
    });

})




    
