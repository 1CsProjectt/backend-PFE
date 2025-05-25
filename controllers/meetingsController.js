import { Op } from "sequelize";
import Meet from "../models/meetingModel.js";
import Team from "../models/groupModel.js";
import {catchAsync} from "../utils/catchAsync.js";
import appError from "../utils/appError.js";
import { v2 as cloudinary } from 'cloudinary';
import Student from "../models/studenModel.js";
import User from "../models/UserModel.js";
import Notification from "../models/notificationModel.js";
import teacher from "../models/teacherModel.js";


export const startNewMeeting = catchAsync(async (req, res, next) => {
    const { date, time, room } = req.body;
    const Meeting_objectives_files = req.files?.Meeting_objectives_files?.[0]?.path;
    const Support_files = req.files?.Support_files?.[0]?.path;
    const Team_deliverables_files = req.files?.Team_deliverables_files?.[0]?.path;
    const My_review_for_deliverables_files = req.files?.My_review_for_deliverables_files?.[0]?.path;
    const Meeting_pv_files = req.files?.Meeting_pv_files?.[0]?.path;
  
    const teamId = req.params.teamId;
    const supervisorId = req.user.id;
  
    // Vérifier si l'utilisateur est bien un superviseur de cette équipe (relation N:N via TeamSupervisors)
    const team = await Team.findByPk(teamId, {
      include: [
        {
          model: teacher,
          as: 'supervisor',
          where: { id: supervisorId },
          through: { attributes: [] },
          required: false,
        },
      ],
    });
  
    if (!team) {
      return next(new appError("Team not found or you are not a supervisor of this team", 403));
    }
  
    // Rendre les anciennes réunions nextMeeting = false
    const priviousMeet = await Meet.findOne({
      where: {
        teamId: teamId,
        nextMeeting: true,
      },
    });
  
    if (priviousMeet) {
      await priviousMeet.update({ nextMeeting: false });
    }
  
    const team_name = team.groupName;
  
    const mymeet = await Meet.create({
      date,
      time,
      room,
      Meeting_objectives_files,
      Support_files,
      Team_deliverables_files,
      My_review_for_deliverables_files,
      Meeting_pv_files,
      teamId,
      supervisorId,
      nextMeeting: true,
      pfeId: team.pfe_id,
    });
  
    // Notifier les membres de l’équipe
    const members = await Student.findAll({
      where: { team_id: teamId },
      include: [{ model: User, as: "user" }],
    });
  
    for (const member of members) {
      if (member.user?.id) {
        await Notification.create({
          user_id: member.user.id,
          type: "new_meeting",
          content: `A new meeting has been scheduled on ${date} at ${time} in room ${room}.`,
          is_read: false,
          metadata: {
            teamId: teamId,
            meetingId: mymeet.id,
            supervisorId: supervisorId,
            room: room,
          },
        });
      }
    }
  
    return res.status(201).json({
      status: `success starting new meeting for team ${team_name} and pfe_id ${team.pfe_id}`,
      data: {
        mymeet,
      },
    });
  });
  







export const getAllMeetings = catchAsync(async (req, res, next) => {
    const meetings = await Meet.findAll({
        where: {
            teamId: req.params.teamId,
            [Op.not]: [
              {work_Status:null}
                
            ]
                
                 
            
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
    const deleteCloudinaryFile = async (url) => {
            if (!url) return;
          
            try {
              const uploadIndex = url.indexOf('/upload/');
              if (uploadIndex === -1) {
                console.error('Invalid Cloudinary URL format');
                return;
              }
          
              const pathAfterUpload = url.substring(uploadIndex + 8);
              const parts = pathAfterUpload.split('/');
          
              // Remove version if present
              if (parts[0].startsWith('v')) {
                parts.shift();
              }
          
              const fileWithExtension = parts.pop();
              let fileNameWithoutExtension = fileWithExtension;
          
              // Remove .jpg or .pdf extension if present
              if (fileWithExtension.endsWith('.jpg')) {
                fileNameWithoutExtension = fileWithExtension.slice(0, -4);
              } else if (fileWithExtension.endsWith('.pdf')) {
                fileNameWithoutExtension = fileWithExtension.slice(0, -4);
              }
          
              parts.push(fileNameWithoutExtension);
              const publicId = parts.join('/');
              console.log(`Public ID: ${publicId}`);
          
              const resourceType = url.includes('/raw/') ? 'raw' : 'image';
          
              await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
                invalidate: true,
              });
          
              console.log(`Deleted ${resourceType} from Cloudinary: ${publicId}`);
            } catch (err) {
              console.error(`Error deleting file from Cloudinary: ${err.message}`);
            }
          };
          
    
        await deleteCloudinaryFile(meeting.Meeting_objectives_files);
        await deleteCloudinaryFile(meeting.Support_files);
        await deleteCloudinaryFile(meeting.Team_deliverables_files);
        await deleteCloudinaryFile(meeting.My_review_for_deliverables_files);
        await deleteCloudinaryFile(meeting.Meeting_pv_files);
        // Send notification to all team members
  const members = await Student.findAll({
    where: { team_id: meeting.teamId },
    include: [{ model: User, as: "user" }],
  });
  

  for (const member of members) {
    if (member.user?.id) {
      await Notification.create({
        user_id: member.user.id,
        type: "meeting_cancelled",
        content: `The meeting scheduled on ${meeting.date} at ${meeting.time} in room ${meeting.room} has been cancelled.`,
        is_read: false,
        metadata: {
          meetingId: meeting.id,
          teamId: meeting.teamId,
          supervisorId: meeting.supervisorId,
        },
      });
    }
  }
        
    await meeting.destroy();
    return res.status(200).json({
        status: "success",
        message: "Meeting cancelled successfully",
       
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
  const { date, time, room } = req.body;

  const fileFields = [
    "Meeting_objectives_files",
    "Support_files",
    "Team_deliverables_files",
    "My_review_for_deliverables_files",
    "Meeting_pv_files"
  ];

  const meeting = await Meet.findByPk(meetingId);
  if (!meeting) {
    return next(new appError("Meeting not found", 404));
  }

  const deleteCloudinaryFile = async (url) => {
    if (!url) return;

    try {
      const uploadIndex = url.indexOf('/upload/');
      if (uploadIndex === -1) {
        console.error('Invalid Cloudinary URL format');
        return;
      }

      const pathAfterUpload = url.substring(uploadIndex + 8);
      const parts = pathAfterUpload.split('/');

      if (parts[0].startsWith('v')) {
        parts.shift(); // remove version
      }

      const fileWithExtension = parts.pop();
      const fileNameWithoutExtension = fileWithExtension.replace(/\.(jpg|pdf)$/, '');
      parts.push(fileNameWithoutExtension);

      const publicId = parts.join('/');
      const resourceType = url.includes('/raw/') ? 'raw' : 'image';

      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      console.log(`Deleted ${resourceType} from Cloudinary: ${publicId}`);
    } catch (err) {
      console.error(`Error deleting file from Cloudinary: ${err.message}`);
    }
  };

  const updatedFiles = {};

  for (const field of fileFields) {
    const newFile = req.files?.[field]?.[0]?.path;
    updatedFiles[field] = newFile ?? meeting[field];

    
    if (newFile && meeting[field]) {
      await deleteCloudinaryFile(meeting[field]);
    }
  }

  await meeting.update({
    date,
    time,
    room,
    ...updatedFiles
  });

  return res.status(200).json({
    status: "success",
    data: {
      meeting,
    },
  });
});


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
