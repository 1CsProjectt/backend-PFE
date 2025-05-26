import SoutenanceAuthorization from "../models/autsoutModel";
import appError from "../utils/appError";
import teacher from "../models/teacherModel";
import Team from "../models/groupModel";
import { catchAsync } from "../utils/catchAsync";


export const createSoutenanceAuthorization = catchAsync(async (req, res, next) => {
  const { teamId, pfeTitle, comment, documentUrl } = req.body;
  const supervisorId = req.user.id; 

  const team = await Team.findByPk(teamId, {
    include: {
      model: teacher,
      as: 'supervisor',
      where: { id: supervisorId },
      through: { attributes: [] },
    },
  });

  if (!team) {
    return next(new appError('You are not a supervisor of this team or the team does not exist.', 403));
  }

  const existing = await SoutenanceAuthorization.findOne({ where: { teamId } });
  if (existing) {
    return next(new appError('Soutenance authorization already exists for this team.', 409));
  }

  const authorization = await SoutenanceAuthorization.create({
    teamId,
    supervisorId,
    pfeTitle,
    comment,
    documentUrl,
  });

  res.status(201).json({
    message: 'Soutenance authorization created successfully',
    authorization,
  });
});

export const updateSoutenanceAuthorization = catchAsync(async (req, res, next) => {
  const { id } = req.params; // authorization ID
  const supervisorId = req.user.id;
  const { pfeTitle, comment, documentUrl } = req.body;

  const authorization = await SoutenanceAuthorization.findByPk(id);
  if (!authorization) {
    return next(new appError('Soutenance authorization not found.', 404));
  }

  // Check if the user is a supervisor of the team
  const team = await Team.findByPk(authorization.teamId, {
    include: {
      model: teacher,
      as: 'supervisor',
      where: { id: supervisorId },
      through: { attributes: [] },
    },
  });

  if (!team) {
    return next(new appError('You are not authorized to update this authorization.', 403));
  }

  // Update fields
  authorization.pfeTitle = pfeTitle ?? authorization.pfeTitle;
  authorization.comment = comment ?? authorization.comment;
  authorization.documentUrl = documentUrl ?? authorization.documentUrl;

  await authorization.save();

  res.status(200).json({
    message: 'Soutenance authorization updated successfully',
    authorization,
  });
});

export const deleteSoutenanceAuthorization = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const supervisorId = req.user.id;

  const authorization = await SoutenanceAuthorization.findByPk(id);
  if (!authorization) {
    return next(new appError('Soutenance authorization not found.', 404));
  }

  // Check if the user is a supervisor of the team
  const team = await Team.findByPk(authorization.teamId, {
    include: {
      model: teacher,
      as: 'supervisor',
      where: { id: supervisorId },
      through: { attributes: [] },
    },
  });

  if (!team) {
    return next(new appError('You are not authorized to delete this authorization.', 403));
  }

  await authorization.destroy();

  res.status(204).json({
    message: 'Soutenance authorization deleted successfully',
  });
});
