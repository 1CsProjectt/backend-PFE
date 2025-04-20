import cron from 'node-cron';
import SupervisionRequest from '../models/SupervisionRequestModel ';
import Preflist from '../models/preflistModel';

cron.schedule('0 * * * *', async () => { 
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const expiredRequests = await SupervisionRequest.findAll({
    where: {
      status: 'PENDING',
      sentAt: { [Op.lt]: cutoff }
    }
  });

  for (const request of expiredRequests) {
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
});
