import { Op } from "sequelize";
import Invitation from "../models/invitationModel.js";
import Student from "../models/studenModel.js";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import appError from "../utils/appError.js";
import { catchAsync  } from "../utils/catchAsync.js";
import Team from "../models/groupModel.js";



export const sendInvitations = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next(new appError("Unauthorized: No user found in request", 401));
  }

  const userId = req.user.id;

  const student = await Student.findOne({ where: { id: userId } });
  if (!student) {
    return next(new appError("Student profile not found", 404));
  }

  if (!student.team_id) {
    return next(new appError("You must be in a team to send invitations", 403));
  }
  const team = await Team.findByPk(student.team_id);
  if (!team) {
    await Student.update(
      { team_id: null, status: 'available' },
      { where: { id: student.team_id } }
    );
    return next(
      new appError(
        'Team not found. All students previously assigned to this team have been made available.',
        404
      )
    );
  }
  const teamMembers = await Student.count({ where: { team_id: student.team_id } });
  const remainingSlots = 6 - teamMembers;

  const { receiver_emails } = req.body;
  if (!Array.isArray(receiver_emails) || receiver_emails.length === 0) {
    return next(new appError("receiver_emails array is required", 400));
  }
  if (receiver_emails.length > remainingSlots) {
    return next(new appError(`You can only invite ${remainingSlots} more student(s)`, 400));
  }
  const senderId = student.id;
  const io = req.app.get("socketio");
  const results = [];

  for (const email of receiver_emails) {
    try {
      const receiverUser = await User.findOne({
        where: { email, role: "student" },
      });

      if (!receiverUser) {
        results.push({ email, status: "failed", reason: "User not found" });
        continue;
      }
      const receiverStudent = await Student.findOne({
        where: { id: receiverUser.id },
      });
      if (!receiverStudent) {
        results.push({ email, status: "failed", reason: "Student profile not found" });
        continue;
      }
      if (receiverStudent.team_id !== null) {
        results.push({ email, status: "failed", reason: "Student already in a team" });
        continue;
      }
      const existingInvitation = await Invitation.findOne({
        where: {
          sender_id: senderId,
          receiver_email: email,
          status: "pending",
        },
      });
      if (existingInvitation) {
        results.push({ email, status: "failed", reason: "Invitation already sent" });
        continue;
      }
      await Invitation.create({ sender_id: senderId, receiver_email: email });
      io.to(receiverUser.id).emit("invitation", {
        sender: student.name,
        message: "You have received a new team invitation.",
      });
      results.push({ email, status: "success"});

    } catch (err) {
      results.push({ email, status: "failed", reason: "Unexpected error" });
    }
  }
  res.status(201).json({
    message: "Invitations processed",
    results,
  });
});

export const cancelInvitation = catchAsync(async (req,res)=>{
  const { invitationId } = req.body;
  if(!req.user || !req.user.id ){
    return next(new appError("Unauthorized: No user found in request", 401));
  }
  const senderId=req.user.id
  const invitation=await Invitation.findOne({
    where:{
      id:invitationId,
      sender_id:senderId,
      status:"pending"
    }
  });
  if(!invitation){
    return next(new appError("no pending invitation found with this ID ",404))
  }
  await invitation.destroy();
  res.status(200).json({message:"invitation has been canceled successfully"})


})
 

export const getAllMypendingInvitations = catchAsync(async (req, res, next) => {
  const user = req.user;

  const invitations = await Invitation.findAll({
    where: { sender_id:user.id, status: "pending" },
    include: [
      {
        model: Student,
        as: "sender",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["email"],
          },
        ],
      },
    ],
  });

  // if (!invitations.length) {
  //   return next(new appError("No pending invitations found", 404));
  // }

  res.status(200).json(invitations);
});

export const getAllMyrecievedInvitations = catchAsync(async (req, res, next) => {
  const user = req.user;

  const invitations = await Invitation.findAll({
    where: { receiver_email:user.email, status: "pending" },
    include: [
      {
        model: Student,
        as: "sender",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["email"],
          },
        ],
      },
    ],
  });

  // if (!invitations.length) {
  //   return next(new appError("No pending invitations found", 404));
  // }

  res.status(200).json(invitations);
});


export const acceptInvitation = catchAsync(async (req, res, next) => {
  const { invitationId } = req.body;
  const user = req.user;

  const invitation = await Invitation.findByPk(invitationId);
  if (!invitation) {
    return next(new appError("Invitation not found", 404));
  }

  if (invitation.receiver_email !== user.email) {
    return next(new appError("You are not authorized to accept this invitation", 403));
  }

  if (invitation.status !== "pending") {
    return next(new appError(`This invitation has already been ${invitation.status}`, 400));
  }

  // Accept the invitation
  invitation.status = "accepted";
  await invitation.save();

  // Get sender student and their team
  const sender = await Student.findByPk(invitation.sender_id);
  if (!sender) {
    return next(new appError("Sender not found", 404));
  }

  const receiver = await Student.findOne({ where: { id: user.id } });
  if (!receiver) {
    return next(new appError("Receiver student profile not found", 404));
  }

  // Add receiver to the team
  receiver.team_id = sender.team_id;
  receiver.status = "in a team";
  await receiver.save();

  // Reject other invitations sent to this user
  await Invitation.update(
    { status: "rejected" },
    {
      where: {
        receiver_email: user.email,
        status: "pending",
        id: { [Op.ne]: invitationId },
      },
    }
  );

  // Check if team is full
  const team = await Team.findByPk(sender.team_id, {
    include: [{ model: Student, as: 'members' }],
  });

  if (team.members.length >= team.maxNumber) {
    team.full = true;
    await team.save();
  }

  res.status(200).json({ message: "Invitation accepted successfully" });
});




export const declineInvitation = catchAsync(async (req, res, next) => {
  const { invitationId } = req.body;
  const user = req.user;

  const invitation = await Invitation.findByPk(invitationId);
  if (!invitation) {
    return next(new appError("Invitation not found", 404));
  }

  if (invitation.receiver_email !== user.email) {
    return next(new appError("You are not authorized to decline this invitation", 403));
  }

  if (invitation.status !== "pending") {
    return next(new appError(`This invitation has already been ${invitation.status}`, 400));
  }

  invitation.status = "rejected";
  await invitation.save();

  res.status(200).json({ message: "Invitation declined successfully" });
});





















// const { Op } = require("sequelize");
// const Invitation = require("../models/invitation");
// const Student = require("../models/student");
// const User = require("../models/user");
// const jwt = require("jsonwebtoken");
// exports.sendinvitation = async (req, res) => {
//   try {
//     const id = req.user.id;

//     const student = await Student.findOne({ where: { id } });
//     if (!student) {
//       return res.status(404).json({ message: "Student profile not found" });
//     }

//     const teammembers = await Student.count({ where: { team_id: student.team_id } });
//     if (teammembers >= 6) {
//       return res.status(400).json({ message: "Your team already has 6 members" });
//     }

//     const sender_id = student.id;
//     const { receiver_email } = req.body;

//     const receiverUser = await User.findOne({
//       where: {
//         email: receiver_email,
//         role: "student",
//       },
//     });

//     if (!receiverUser) {
//       return res.status(404).json({ message: "Receiver not found" });
//     }

//     const existingreceiver = await Invitation.findOne({
//       where: { sender_id, receiver_email, status: "pending" },
//     });

//     if (existingreceiver) {
//       return res.status(409).json({ message: "Invitation already sent" });
//     }

//     const checkifinteam = await Student.findOne({
//       where: {
//         id: receiverUser.id,
//         team_id: { [Op.ne]: null },
//       },
//     });

//     if (checkifinteam) {
//       return res.status(400).json({ message: "This student is already in a team." });
//     }

//     await Invitation.create({ sender_id, receiver_email });

//     const io = req.app.get("socketio");
//     io.to(receiverUser.id).emit("invitation", {
//       sender: student.name,
//       message: "You have received a new team invitation.",
//     });

//     return res.status(201).json({ message: "Invitation sent successfully" });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };


// // Get all invitations received by the current user
// exports.getallmyinvitations = async (req, res) => {
//   try {
//     const user = req.user;

//     const invitations = await Invitation.findAll({
//       where: {
//         receiver_email: user.email,
//         status: "pending",
//       },
//       include: [
//         {
//           model: Student,
//           as: "sender",
//           include: [
//             {
//               model: User,
//               as: "user",
//               attributes: ["email"],
//             },
//           ],
//         },
//       ],
//     });

//     return res.status(200).json(invitations);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


// // Accept invitation and reject all others
//  exports.acceptInvitation = async (req, res) => {
//   try {
//     const { invitationId } = req.body;
//     const user = req.user;

//     const invitation = await Invitation.findByPk(invitationId);
//     if (!invitation) {
//       return res.status(404).json({ message: "Invitation not found" });
//     }

//     if (invitation.receiver_email !== user.email) {
//       return res.status(403).json({ message: "You are not authorized to accept this invitation" });
//     }

//     if (invitation.status !== "pending") {
//       return res.status(400).json({ message: `This invitation has already been ${invitation.status}` });
//     }

//     invitation.status = "accepted";
//     await invitation.save();

//     const sender = await Student.findByPk(invitation.sender_id);
//     if (!sender) {
//       return res.status(404).json({ message: "Sender not found" });
//     }

//     const receiver = await Student.findOne({ where: { id: user.id } });
//     if (!receiver) {
//       return res.status(404).json({ message: "Receiver student not found" });
//     }

//     receiver.team_id = sender.team_id;
//     receiver.status = "in a team";
//     await receiver.save();

//     // Reject all other invitations
//     await Invitation.update(
//       { status: "rejected" },
//       {
//         where: {
//           receiver_email: user.email,
//           status: "pending",
//           id: { [Op.ne]: invitationId },
//         },
//       }
//     );

//     return res.status(200).json({ message: "Invitation accepted successfully" });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };




//   //decline invitation
//   exports.declineInvitation = async (req, res) => {
//   try {
//     const { invitationId } = req.body;
//     const user = req.user;

//     const invitation = await Invitation.findByPk(invitationId);
//     if (!invitation) {
//       return res.status(404).json({ message: "Invitation not found" });
//     }

//     if (invitation.receiver_email !== user.email) {
//       return res.status(403).json({ message: "You are not authorized to decline this invitation" });
//     }

//     if (invitation.status !== "pending") {
//       return res.status(400).json({ message: `This invitation has already been ${invitation.status}` });
//     }

//     invitation.status = "rejected";
//     await invitation.save();

//     return res.status(200).json({ message: "Invitation declined successfully" });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };


 