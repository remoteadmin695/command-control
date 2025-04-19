const socket = new WebSocket("wss://command-control-server.onrender.com");
let pc = null;
let currentDeviceId = null;

function createPeerConnection() {
    pc = new RTCPeerConnection();

    pc.ontrack = (event) => {
        const audio = document.getElementById("remoteAudio");
        audio.srcObject = event.streams[0];
        audio.style.display = "block";
        document.getElementById("connectedStatus").textContent = `🎙️ Listening to ${currentDeviceId}`;
    };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.send(JSON.stringify({
                type: "candidate",
                candidate: event.candidate,
                deviceId: currentDeviceId
            }));
        }
    };
}

socket.onopen = () => {
    console.log("✅ WebSocket connected");
    socket.send(JSON.stringify({ type: "get_devices" }));
};

socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "device_list") {
        const list = document.getElementById("deviceList");
        list.innerHTML = "";
        data.devices.forEach(deviceId => {
            const div = document.createElement("div");
            div.className = "device";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = deviceId;

            const button = document.createElement("button");
            button.textContent = "Listen";
            button.onclick = () => {
                currentDeviceId = deviceId;
                socket.send(JSON.stringify({ type: "join", role: "listener", deviceId }));
                document.getElementById("connectedStatus").textContent = `🔄 Connecting to ${deviceId}...`;
            };

            div.appendChild(nameSpan);
            div.appendChild(button);
            list.appendChild(div);
        });
    }

    if (data.type === "offer") {
        createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send(JSON.stringify({
            type: "answer",
            answer: pc.localDescription,
            deviceId: currentDeviceId
        }));
    }

    if (data.type === "candidate" && pc) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
            console.error("Failed to add ICE candidate:", e);
        }
    }
};
