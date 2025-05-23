import { Notification } from "../models";

exports.getMyNotifications = async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [["createdAt", "DESC"]],
  });
  res.status(200).json({ notifications });
};

exports.markNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOne({
    where: { id, user_id: req.user.id },
  });

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  notification.is_read = true;
  await notification.save();

  res.status(200).json({ message: "Notification marked as read" });
};

exports.getUnreadNotificationCount = async (req, res) => {
  const count = await Notification.count({
    where: { user_id: req.user.id, is_read: false },
  });

  res.status(200).json({ unreadCount: count });
};
