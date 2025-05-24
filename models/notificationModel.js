// models/NotificationModel.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('invitation', 'message', 'info', 'alert','invitation-declined', 'invitation-accepted'),
    defaultValue: 'info',
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  metadata: {
    type: DataTypes.JSON, // Optional data like sender name, team ID, etc.
    allowNull: true,
  },
}, {
  tableName: 'Notifications',
});

export default Notification;
