import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

// ---- Your route (keep your real coordinates here) ----
const stops = [
  { name: "Main Gate (College)", lat: 26.3448626, lng:80.4501424 },
  { name: "Stop A", lat: 26.411467, lng:80.386982 },
  { name: "Stop B", lat: 26.4010635, lng:80.272814 },
  { name: "Stop C", lat: 26.4615839, lng:80.3224565 },
];

const map = L.map("map", { zoomControl: false }).setView([stops[0].lat, stops[0].lng], 14);
L.control.zoom({ position: "topright" }).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

stops.forEach((s) =>
  L.circleMarker([s.lat, s.lng], {
    radius: 8, color: "#22303C", weight: 3, fillColor: "#ffffff", fillOpacity: 1,
  }).addTo(map).bindPopup(s.name)
);
// ---- Draw route along roads using OSRM (note: it wants lng,lat order) ----
async function drawRoadRoute() {
  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const line = L.geoJSON(data.routes[0].geometry, {
      style: { color: "#22303C", weight: 6 },
    }).addTo(map);
    map.fitBounds(line.getBounds());
  } catch (e) {
    // fallback: straight lines if the routing service is down
    L.polyline(stops.map((s) => [s.lat, s.lng]), { color: "#1a73e8" }).addTo(map);
  }
}
drawRoadRoute();

// ---- Live bus ----
const busIcon = L.divIcon({ html: "🚌", className: "bus-icon", iconSize: [40, 40] });
let busMarker = null;
let lastUpdate = 0;

function nearestStop(lat, lng) {
  let best = null;
  stops.forEach((s) => {
    const d = map.distance([lat, lng], [s.lat, s.lng]);
    if (!best || d < best.d) best = { name: s.name, d };
  });
  return best;
}

onValue(ref(db, "bus/location"), (snapshot) => {
  const data = snapshot.val();
  if (!data) { lastUpdate = 0; return renderStatus(); }

  lastUpdate = data.updatedAt;
  const pos = [data.lat, data.lng];
    if (!busMarker) {
    busMarker = L.marker(pos, { icon: busIcon }).addTo(map);
    // first time only: zoom so the bus and the Main Gate are both visible
    map.fitBounds([pos, [stops[0].lat, stops[0].lng]], { padding: [60, 60] });
  } else {
    busMarker.setLatLng(pos);
  }

  const n = nearestStop(data.lat, data.lng);
    document.getElementById("nextStop").textContent = n.name;
  document.getElementById("distance").textContent = `${Math.round(n.d)} m from the bus`;
  renderStatus();
});

function renderStatus() {
  const secondsAgo = (Date.now() - lastUpdate) / 1000;
  const el = document.getElementById("status");
  if (!lastUpdate) {
    el.dataset.state = "offline";
    el.textContent = "Bus offline";
  } else if (secondsAgo > 30) {
    el.dataset.state = "lost";
    el.textContent = "Signal lost, last seen " + Math.round(secondsAgo) + "s ago";
  } else {
    el.dataset.state = "live";
    el.textContent = "Live";
  }
}
setInterval(renderStatus, 5000);