const socket = new WebSocket(`wss://${location.host}`);

let pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

socket.addEventListener("open", () => {
  socket.send(JSON.stringify({ role: "browser" }));
});

socket.addEventListener("message", async (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "offer") {
    await pc.setRemoteDescription(new RTCSessionDescription(data));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.send(JSON.stringify({ ...answer.toJSON(), role: "browser", type: "answer" }));
  }

  if (data.type === "ice") {
    try {
      await pc.addIceCandidate(data.candidate);
    } catch (e) {
      console.error("Error adding ICE candidate:", e);
    }
  }
});

pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.send(JSON.stringify({
      type: "ice",
      target: "android",
      role: "browser",
      candidate: event.candidate
    }));
  }
};

pc.ontrack = (event) => {
  const audio = document.getElementById("remoteAudio");
  audio.srcObject = event.streams[0];
};

document.getElementById("listenBtn").onclick = async () => {
  console.log("Waiting for audio stream...");
};
