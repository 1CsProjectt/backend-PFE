// ✅ Utiliser import au lieu de require
import { io } from "socket.io-client";

const socket = io("https://backend-pfe-1.onrender.com", {
    transports: ["websocket"], // ⚠️ Utile pour Render
  });

socket.on("connect", () => {
  console.log("✅ Connected to backend with ID:", socket.id);

  // ✅ Rejoins la room avec ton user ID
  socket.emit("register", "123");

  // Pour test, écoute l’invitation
  socket.on("invitation", (data) => {
    console.log("📨 Received invitation:", data);
  });
});
