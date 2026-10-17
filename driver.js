import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { ref, set, remove } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const $ = (id) => document.getElementById(id);
let watchId = null;
let heartbeat = null;
let wakeLock = null;
let lastPos = null;

function say(text) { $("msg").textContent = text; }

onAuthStateChanged(auth, (user) => {
  $("loginBox").classList.toggle("hidden", !!user);
  $("trackBox").classList.toggle("hidden", !user);
});

$("loginBtn").addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, $("email").value, $("password").value);
    say("");
  } catch (e) {
    say("Login failed: " + e.code);
  }
});

$("logoutBtn").addEventListener("click", () => { stopSharing(); signOut(auth); });

// Keep the screen awake while sharing
async function keepScreenOn() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (e) {
    console.log("Wake lock not available:", e);
  }
}

// The wake lock is released when you switch tabs, so ask again when you return
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && watchId !== null) keepScreenOn();
});

// Send the last known position to Firebase
function send() {
  if (!lastPos) return;
  set(ref(db, "bus/location"), {
    lat: lastPos.latitude,
    lng: lastPos.longitude,
    updatedAt: Date.now(),
  })
    .then(() => say("Sent OK at " + new Date().toLocaleTimeString()))
    .catch((err) => say("Write failed: " + err.code));
}

$("startBtn").addEventListener("click", () => {
  if (!navigator.geolocation) return say("This device has no GPS support.");

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      lastPos = pos.coords;
      send();
    },
    (err) => say("Location error: " + err.message),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
  );

  // Heartbeat: keep the signal alive even when the phone is not moving
  heartbeat = setInterval(send, 5000);
  keepScreenOn();

  $("startBtn").classList.add("hidden");
  $("stopBtn").classList.remove("hidden");
});

function stopSharing() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  clearInterval(heartbeat);
  heartbeat = null;
  lastPos = null;
  if (wakeLock) { wakeLock.release(); wakeLock = null; }
  remove(ref(db, "bus/location"));
  $("startBtn").classList.remove("hidden");
  $("stopBtn").classList.add("hidden");
  say("Stopped sharing.");
}
$("stopBtn").addEventListener("click", stopSharing);