import catchAsync from '../utils/catchAsync.js';
import appError from '../utils/appError.js';
import Preflist from '../models/preflistModel.js';
import Student from '../models/studenModel.js';

export const createPreflist = catchAsync(async (req, res, next) => {
  const { pfeIds } = req.body;

  if (!req.user) {
    return next(new appError('User was not found, login and try again', 403));
  }

  const user = req.user;
  const mystudent = await Student.findByPk(user.id); 

  if (!mystudent) {
    return next(new appError('Student not found', 403));
  }

  if (!Array.isArray(pfeIds) || pfeIds.length !== 5) {
    return next(new appError('You must provide exactly 5 PFE IDs.', 400));
  }

  const unique = new Set(pfeIds);
  if (unique.size !== 5) {
    return next(new appError('Duplicate PFE IDs are not allowed.', 400));
  }

  const teamId = mystudent.team_id;

  if (!teamId) {
    return next(new appError('Student is not in a team', 403));
  }

  const existing = await Preflist.findOne({ where: { teamId } });
  if (existing) {
    return next(new appError('This team has already submitted a preflist.', 400));
  }

  const preflistEntries = pfeIds.map((pfeId, index) => ({
    teamId,
    pfeId,
    order: index + 1,
  }));

  const created = await Preflist.bulkCreate(preflistEntries);

  res.status(201).json({
    status: 'success',
    message: `Preflist created for team ${teamId}`,
    data: created,
  });
});
