import  Notification  from "../models/notificationModel.js";
import { Op } from "sequelize";




export const sendNotification = async (req, res) => {
    try {
      const io = req.app.get("socketio"); 
      io.emit("notification", { message: "New event posted!" });
  
      return res.status(200).json({ message: "Notification sent" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  

export const getMyNotifications = async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id , is_read: false },
    order: [["createdAt", "DESC"]],
  });
  res.status(200).json({ notifications });
};

export const markNotificationAsRead = async (req, res) => {
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

export const getUnreadNotificationCount = async (req, res) => {
  const count = await Notification.count({
    where: { user_id: req.user.id, is_read: false },
  });

  res.status(200).json({ unreadCount: count });
};
