const socket = new WebSocket("wss://command-control-server.onrender.com");

let pc = null;

function createPeerConnection() {
  pc = new RTCPeerConnection();

  pc.ontrack = (event) => {
    const audio = document.getElementById("remoteAudio");
    audio.srcObject = event.streams[0];
    audio.play();
    console.log("🔊 Audio stream started");
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
    }
  };
}

socket.onopen = () => {
  console.log("✅ WebSocket connected");
  socket.send(JSON.stringify({ type: "join", role: "listener" }));
};

socket.onmessage = async (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "offer") {
    createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.send(JSON.stringify({ type: "answer", answer }));
  }

  if (data.type === "candidate" && pc) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (e) {
      console.error("Failed to add ICE candidate:", e);
    }
  }
};