import { io } from "socket.io-client";

// Connect to your deployed backend
const socket = io("https://backend-pfe-1.onrender.com", {
  transports: ["websocket"],  // Force websocket only (skip polling delay)
  reconnectionAttempts: 5,
  timeout: 10000
});

socket.on("connect", () => {
  console.log("✅ Connected as client:", socket.id);

  const userId = "123"; // Replace with the real user ID if needed
  socket.emit("join", userId);
  console.log(`📡 Joined room: ${userId}`);
});

socket.on("invitation", (data) => {
  console.log("📩 Received invitation:", data);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});

socket.on("connect_error", (err) => {
  console.error("⛔ Connection error:", err.message);
});
