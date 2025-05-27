import teacher from "../models/teacherModel.js";
import Team from "../models/groupModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import appError from "../utils/appError.js";
import Soutenance from "../models/soutModel.js";
import Notification from "../models/notificationModel.js";
import Student from "../models/studenModel.js";


export const uploadGlobalPlanning = catchAsync(async (req, res, next) => {
  const { year } = req.body;

  // Validate year input
  const validYears = ['2CP', '1CS', '2CS', '3CS'];
  if (!year || !validYears.includes(year)) {
    return next(new appError('Valid academic year is required (2CP, 1CS, 2CS, 3CS).', 400));
  }

  // Validate file presence
  if (!req.files?.soutplanning?.[0]) {
    return next(new appError('PDF file (soutplanning) is required.', 400));
  }

  const filePath = req.files.soutplanning[0].path;

  // Create Soutenance entry with no team, only for planning
  const soutenance = await Soutenance.create({
    soutplanning: filePath,
    year,
  });

//   // Find users to notify (students + teachers of this year)
//   const usersToNotify = await User.findAll({
//     where: {
//       role: ['student', 'teacher'],
//     year 
//     },
//   });

//   // Notify relevant users
//   await Promise.all(
//     usersToNotify.map(user =>
//       Notification.create({
//         user_id: user.id,
//         type: 'global-soutenance-planning',
//         content: `A new global soutenance planning PDF has been uploaded for ${year}.`,
//         is_read: false,
//         metadata: {
//           soutenanceId: soutenance.id,
//           filePath: filePath,
//           year,
//           uploadedAt: new Date(),
//         },
//       })
//     )
//   );

  res.status(201).json({
    message: 'Global soutenance planning uploaded and notifications sent.',
    soutenance,
  });
});





export const getGlobalPlanningforstudent = catchAsync(async (req, res, next) => {

    const mystudent=await Student.findOne({
    where: { id: req.user.id }});
    if (!mystudent){
  const planning = await Soutenance.findOne({
    where: { year: mystudent.year },
    order: [['createdAt', 'DESC']], 
  })
    }else{
        next(new appError('student not found',404))
    }
  if (!planning ) {
    return next(new appError('No global soutenance planning found.', 404));
  }

  res.status(200).json({
    message: 'Global soutenance planning retrieved successfully.',
    planning,
    fileUrl: `${req.protocol}://${req.get('host')}/${planning.soutplanning}`, 
  });
});

export const getGlobalPlanningforteachers = catchAsync(async (req, res, next) => {
  const planning = await Soutenance.findAll();

  if (!planning ) {
    return next(new appError('No global soutenance planning found.', 404));
  }

  res.status(200).json({
    message: 'Global soutenance planning retrieved successfully.',
    planning,
    fileUrl: `${req.protocol}://${req.get('host')}/${planning.soutplanning}`, 
  });
});