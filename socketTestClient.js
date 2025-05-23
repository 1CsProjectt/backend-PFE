import { io } from "socket.io-client";

// Replace with your local backend URL or Render link
const socket = io("https://backend-pfe-1.onrender.com"); 

socket.on("connect", () => {
  console.log("✅ Connected as client with ID:", socket.id);

  // Join private room (e.g., userId = 123)
  socket.emit("join", "123");

  // Listen for invitation events
  socket.on("invitation", (data) => {
    console.log("📩 Received invitation:", data);
  });
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});
