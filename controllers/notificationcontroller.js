


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
  