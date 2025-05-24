import { Op } from "sequelize";
import Student from "../models/studenModel.js";
import User from "../models/UserModel.js";
import Team from "../models/groupModel.js";
import JoinRequest from "../models/jointeamModel.js";
import jwt from "jsonwebtoken";
import { catchAsync } from "../utils/catchAsync.js";
import appError from "../utils/appError.js";

export const sendJoinRequest = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findOne({
      where: { id: userId },
      include: [{ model: User, as: "user" }],
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    const { id } = req.body;

    const group = await Team.findByPk(id);
    if (!group) return res.status(404).json({ message: "Team not found" });

    if (student.team_id) {
      return res.status(400).json({ message: "You are already in a group" });
    }

    const groupMembersCount = await Student.count({ where: { team_id: id } });
    if (groupMembersCount >= group.maxNumber) {
      return res.status(400).json({ message: `This group already has ${group.maxNumber} members` });
    }

    const existing = await JoinRequest.findOne({
      where: { student_id: student.id, team_id: id, status: "pending" },
    });

    if (existing) {
      return res.status(400).json({ message: "You already sent a request to this group" });
    }

    await JoinRequest.create({ student_id: student.id, team_id: id });

    
    const members = await Student.findAll({
      where: { team_id: id },
      include: [{ model: User, as: "user" }],
    });

    for (const member of members) {
      if (member.user?.id) {
        await Notification.create({
          user_id: member.user.id,
          type: "join_request",
          content: `${student.name} sent a join request to your group.`,
          is_read: false,
          metadata: {
            requesterId: student.id,
            requesterName: student.name,
           
          },
        });
      }
    }

    return res.status(200).json({ message: "Join request sent successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



export const getAllJoinMyTeamRequests = async (req, res) => {
  try {
    const id = req.user.id;

    const student = await Student.findOne({ where: { id } });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const team_id = student.team_id;
    if (!team_id) {
      return res.status(400).json({ message: "You are not in a team" });
    }

    const requests = await JoinRequest.findAll({
      where: {
        team_id,
        status: "pending"
      },
      include: [
        {
          model: Student,
          as: "student",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["email"]
            }
          ]
        }
      ]
    });

    return res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptJoinRequest = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const student = await Student.findOne({
    where: { id: userId },
    include: [{ model: User, as: "user" }],
  });

  if (!student) return next(new appError("Student not found", 404));

  const group_id = student.team_id;
  const groupMembers = await Student.count({ where: { team_id: group_id } });

  if (groupMembers >= 6) {
    return next(new AppError("Team is already full", 400));
  }

  const { requestId } = req.body;
  const joinRequest = await JoinRequest.findByPk(requestId);
  if (!joinRequest) {
    return next(new appError("Join request not found", 404));
  }

  const sender = await Student.findByPk(joinRequest.student_id, {
    include: [{ model: User, as: "user" }],
  });
  if (!sender) {
    return next(new appError("Sender student not found", 400));
  }

  if (sender.team_id) {
    return next(new appError("This student is already in a group", 400));
  }

  const group = await Team.findByPk(joinRequest.team_id);
  if (!group) {
    return next(new appError("Team not found", 404));
  }

  if (group.id !== student.team_id) {
    return next(new appError("Not authorized to accept this request", 403));
  }

  await sender.update({ team_id: group.id, status: "in a team" });
  await joinRequest.update({ status: "accepted" });

  // 🔔 Notification au demandeur
  if (sender.user?.id) {
    await Notification.create({
      user_id: sender.user.id,
      type: "join_request_accepted",
      content: `${student.name} accepted your join request to their group.`,
      is_read: false,
      metadata: {
        teamId: group.id,
        accepterId: student.id,
        accepterName: student.name,
      },
    });
  }

  return res.status(200).json({ message: "Join request accepted" });
});



export const rejectJoinRequests = catchAsync(async (req, res, next) => {
  const { requestId } = req.body;

  const joinRequest = await JoinRequest.findByPk(requestId);
  if (!joinRequest) {
    return next(new appError("Join request not found", 404));
  }

  const student = await Student.findByPk(joinRequest.student_id, {
    include: [{ model: User, as: "user" }],
  });

  await joinRequest.update({ status: "rejected" });

  // 🔔 Notification au demandeur
  if (student?.user?.id) {
    await Notification.create({
      user_id: student.user.id,
      type: "join_request_rejected",
      content: `Your join request to a group was rejected.`,
      is_read: false,
      metadata: {
        requestId: joinRequest.id,
        teamId: joinRequest.team_id,
      },
    });
  }

  res.status(200).json({ message: "Join request rejected" });
});


