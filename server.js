const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let androidClient = null;
let browserClient = null;

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.role === "android") {
      androidClient = ws;
    } else if (data.role === "browser") {
      browserClient = ws;
    }

    // Relay signaling messages
    if (data.type === "offer" && browserClient) {
      browserClient.send(JSON.stringify(data));
    } else if (data.type === "answer" && androidClient) {
      androidClient.send(JSON.stringify(data));
    } else if (data.type === "ice" && data.target === "android" && androidClient) {
      androidClient.send(JSON.stringify(data));
    } else if (data.type === "ice" && data.target === "browser" && browserClient) {
      browserClient.send(JSON.stringify(data));
    }
  });

  ws.on("close", () => {
    if (ws === androidClient) androidClient = null;
    if (ws === browserClient) browserClient = null;
  });
});

app.use(express.static(path.join(__dirname, "public")));

server.listen(3000, () => {
  console.log("WebRTC signaling server running on http://localhost:3000");
});
