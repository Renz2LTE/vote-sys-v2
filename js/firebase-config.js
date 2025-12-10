import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js"; // Import Storage

const firebaseConfig = {
  apiKey: "AIzaSyBrMco-_L76Prf7dkCOu3QfBTC5DTB315M",
  authDomain: "login-form-d9e8b.firebaseapp.com",
  projectId: "login-form-d9e8b",
  storageBucket: "login-form-d9e8b.firebasestorage.app",
  messagingSenderId: "780297703902",
  appId: "1:780297703902:web:3f1acdbce4faf06aff0d4f",
  measurementId: "G-VTZ78CJHES"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Storage

export { auth, db, storage }; // Export storage so other files can use it