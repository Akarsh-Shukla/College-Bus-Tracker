import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { ref, set, remove } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const $ = (id) => document.getElementById(id);
let watchId = null;

function say(text) { $("msg").textContent = text; }

// Show login or tracking panel depending on login state
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

$("startBtn").addEventListener("click", () => {
  if (!navigator.geolocation) return say("This device has no GPS support.");

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      set(ref(db, "bus/location"), {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        updatedAt: Date.now(),
      });
      say("Sharing... last sent " + new Date().toLocaleTimeString());
    },
    (err) => say("Location error: " + err.message),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
  );
  $("startBtn").classList.add("hidden");
  $("stopBtn").classList.remove("hidden");
});

function stopSharing() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  remove(ref(db, "bus/location")); // students will see "offline"
  $("startBtn").classList.remove("hidden");
  $("stopBtn").classList.add("hidden");
  say("Stopped sharing.");
}
$("stopBtn").addEventListener("click", stopSharing);