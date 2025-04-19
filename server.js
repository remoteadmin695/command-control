const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ✅ Serve static frontend (public/index.html, client.js, etc.)
app.use(express.static(path.join(__dirname, "public")));

// ✅ WebRTC signaling: Multi-device routing
const devices = {}; // { deviceId: { broadcaster: ws, listener: ws } }

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error("❌ Invalid JSON:", message);
      return;
    }

    const { type, role, offer, answer, candidate, deviceId } = data;

    if (!deviceId) {
      console.warn("⚠️ No deviceId provided");
      return;
    }

    // Init device record if not exists
    if (!devices[deviceId]) {
      devices[deviceId] = { broadcaster: null, listener: null };
    }

    if (type === "join") {
      if (role === "broadcaster") {
        devices[deviceId].broadcaster = ws;
        ws.role = "broadcaster";
        ws.deviceId = deviceId;
        console.log(`📡 Broadcaster joined (${deviceId})`);
      } else if (role === "listener") {
        devices[deviceId].listener = ws;
        ws.role = "listener";
        ws.deviceId = deviceId;
        console.log(`🎧 Listener joined (${deviceId})`);
      }
    }

    if (type === "offer" && devices[deviceId].listener) {
      devices[deviceId].listener.send(JSON.stringify({ type: "offer", offer }));
    }

    if (type === "answer" && devices[deviceId].broadcaster) {
      devices[deviceId].broadcaster.send(JSON.stringify({ type: "answer", answer }));
    }

    if (type === "candidate") {
      const target = ws.role === "broadcaster"
        ? devices[deviceId].listener
        : devices[deviceId].broadcaster;

      if (target) {
        target.send(JSON.stringify({ type: "candidate", candidate }));
      }
    }
  });

  ws.on("close", () => {
    const { role, deviceId } = ws;
    if (deviceId && devices[deviceId]) {
      if (role === "broadcaster") {
        devices[deviceId].broadcaster = null;
        console.log(`❌ Broadcaster left (${deviceId})`);
      } else if (role === "listener") {
        devices[deviceId].listener = null;
        console.log(`👂 Listener left (${deviceId})`);
      }

      // Cleanup
      if (!devices[deviceId].broadcaster && !devices[deviceId].listener) {
        delete devices[deviceId];
      }
    }
  });
});

// ✅ Start the server (supports HTTP + WebSocket)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 WebRTC Signaling Server running at: http://localhost:${PORT}`);
  console.log(`🌐 Deployed URL: https://command-control-server.onrender.com`);
});
