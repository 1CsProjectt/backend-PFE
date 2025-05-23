// models/notification.js
module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define("Notification", {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("invitation", "message", "info", "alert"),
        defaultValue: "info",
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
        type: DataTypes.JSON, // Optional data (team_id, sender_name, etc.)
        allowNull: true,
      },
    });
  
    Notification.associate = (models) => {
      Notification.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    };
  
    return Notification;
  };
  