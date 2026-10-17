import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyBRQK1Q04CZJYC0dq8v0Vzfa7FxWCZGQDg",
  authDomain: "bus-tracker-48cb5.firebaseapp.com",
  databaseURL: "https://bus-tracker-48cb5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bus-tracker-48cb5",
  storageBucket: "bus-tracker-48cb5.firebasestorage.app",
  messagingSenderId: "18714448795",
  appId: "1:18714448795:web:8fea84a123ef777004c73e"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);