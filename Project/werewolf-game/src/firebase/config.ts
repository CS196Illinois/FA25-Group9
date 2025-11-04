// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXWJelPxsty-B2NugvBl_yohfk9Ggx5Rw",
  authDomain: "werewolf-game-441e4.firebaseapp.com",
  projectId: "werewolf-game-441e4",
  storageBucket: "werewolf-game-441e4.firebasestorage.app",
  messagingSenderId: "667544375313",
  appId: "1:667544375313:web:e0a9e0d408dc32111a61b0",
  measurementId: "G-F1KXKKWD8T",
  databaseURL: "https://werewolf-game-441e4-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Export the app instance
export default app;
