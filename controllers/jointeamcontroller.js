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

    const groupMembers = await Student.count({ where: { team_id: id } });
    if (groupMembers >= group.maxNumber) {
      return res.status(400).json({ message: `This group already has ${group.maxNumber} members` });
    }

    const existing = await JoinRequest.findOne({
      where: { student_id: student.id, team_id: id, status: "pending" },
    });

    if (existing) {
      return res.status(400).json({ message: "You already sent a request to this group" });
    }

    await JoinRequest.create({ student_id: student.id, team_id: id });

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

  const sender = await Student.findByPk(joinRequest.student_id);
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

  return res.status(200).json({ message: "Join request accepted" });
});



export const rejectJoinRequests = catchAsync(async (req, res, next) => {
  const { requestId } = req.body;

  const joinRequest = await JoinRequest.findByPk(requestId);
  if (!joinRequest) {
    return next(new appError("Join request not found", 404));
  }

  await joinRequest.update({ status: "rejected" });

  res.status(200).json({ message: "Join request rejected" });
});






// const { Op, where } = require("sequelize");
// const Student = require("../models/student");
// const User = require("../models/user");
// const Team = require("../models/team");
// const jwt = require("jsonwebtoken");
// const JoinRequest = require("../models/jointeam");
// exports.sendjoinrequest = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const student = await Student.findOne({
//       where: { id: userId },
//       include: [{ model: User, as: "user" }],
//     });

//     if (!student) return res.status(404).json({ message: "Student not found" });

//     const { team_id } = req.body;
//     const team = await Team.findByPk(team_id);
//     if (!team) return res.status(404).json({ message: "Team not found" });

//     if (student.team_id) {
//       return res.status(400).json({ message: "You are already in a team" });
//     }

//     const teammembers = await Student.count({ where: { team_id } });
//     if (teammembers >= 6) {
//       return res.status(400).json({ message: "This team already has 6 members" });
//     }

//     const existing = await JoinRequest.findOne({
//       where: { student_id: student.student_id, team_id, status: "pending" },
//     });

//     if (existing) {
//       return res.status(400).json({ message: "You already sent a request to this team" });
//     }

//     await JoinRequest.create({ student_id: student.student_id, team_id });

//     // 🔔 Notify all team members
//     const teamMembers = await Student.findAll({
//       where: { team_id },
//       include: [{ model: User, as: "user", attributes: ["id", "username"] }],
//     });

//     const io = req.app.get("socketio");

//     teamMembers.forEach((member) => {
//       io.to(member.user.id).emit("join-request", {
//         sender: student.name,
//         message: `${student.name} wants to join your team.`,
//         team_id,
//       });
//     });

//     return res.status(200).json({ message: "Join request sent successfully" });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };





// exports.getalljoinmyteamrequests = async (req, res) => {
//   try {
//     const id = req.user.id;

//     const student = await Student.findOne({ where: { id } });
//     if (!student) {
//       return res.status(404).json({ message: "Student profile not found" });
//     }

//     const team_id = student.team_id;
//     if (!team_id) {
//       return res.status(400).json({ message: "You are not in a team" });
//     }

//     const requests = await JoinRequest.findAll({
//       where: {
//         team_id,
//         status: "pending"
//       },
//       include: [
//         {
//           model: Student,
//           as: "student",
//           include: [
//             {
//               model: User,
//               as: "user",
//               attributes: ["email"]
//             }
//           ]
//         }
//       ]
//     });

//     return res.status(200).json(requests);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };



// exports.accepteJoinRequests = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const student = await Student.findOne({
//       where: { id: userId },
//       include: [{ model: User, as: "user" }],
//     });
//     if (!student) return res.status(404).json({ message: "Student not found" });

//     const team_id = student.team_id;
//     const teammembers = await Student.count({ where: { team_id } });

//     if (teammembers >= 6) {
//       return res.status(400).json({ message: "Team is already full" });
//     }

//     const { requestId } = req.body;
//     const joinrequest = await JoinRequest.findByPk(requestId);
//     if (!joinrequest) {
//       return res.status(404).json({ message: "Join request not found" });
//     }

//     const sender = await Student.findByPk(joinrequest.student_id);
//     if (!sender) {
//       return res.status(400).json({ message: "Sender student not found" });
//     }

//     if (sender.team_id) {
//       return res.status(400).json({ message: "This student is already in a team" });
//     }

//     const team = await Team.findByPk(joinrequest.team_id);
//     if (!team) {
//       return res.status(404).json({ message: "Team not found" });
//     }

//     if (team.team_id !== student.team_id) {
//       return res.status(403).json({ message: "Not authorized to accept this request" });
//     }

//     await sender.update({ team_id: team.team_id, status: "in a team" });
//     await joinrequest.update({ status: "accepted" });

//     return res.status(200).json({ message: "Join request accepted" });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };



// exports.rejectJoinRequests = async (req, res) => {
//   try {
//     const { requestId } = req.body;

//     const joinrequest = await JoinRequest.findByPk(requestId);
//     if (!joinrequest) {
//       return res.status(404).json({ message: "Join request not found" });
//     }

//     await joinrequest.update({ status: "rejected" });

//     return res.status(200).json({ message: "Join request rejected" });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };



