import cron from 'node-cron';
import { Op } from 'sequelize';
import SupervisionRequest from '../models/SupervisionRequestModel.js';
import Preflist from '../models/preflistModel.js';

cron.schedule('0 * * * *', async () => {
  try {
    const cutoff = new Date(Date.now() - 1 * 10 * 60 * 1000); // 48 hours ago
    console.log(cutoff)

    const expiredRequests = await SupervisionRequest.findAll({
      where: {
        status: 'PENDING',
        requestedAt: { [Op.lt]: cutoff }
      }
    });

    for (const request of expiredRequests) {
      
      const existingAccepted = await SupervisionRequest.findOne({
        where: {
          teamId: request.teamId,
          status: 'ACCEPTED'
        }
      });

      if (existingAccepted) {
        continue;
      }

      
      request.status = 'REJECTED';
      await request.save();

      
      const preflist = await Preflist.findAll({
        where: { teamId: request.teamId },
        order: [['order', 'ASC']]
      });

      
      const currentIndex = preflist.findIndex(p => p.pfeId === request.pfeId);
      const next = preflist[currentIndex + 1];

      if (next) {
        
        await SupervisionRequest.create({
          teamId: request.teamId,
          pfeId: next.pfeId,
          status: 'PENDING',
          sentAt: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error processing expired supervision requests:', error);
  }
});
