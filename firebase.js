import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"
const firebaseConfig = {
    apiKey: "AIzaSyBG2kySsHRPsWHLw4QXO1hslFgNDLVJW_4",
    authDomain: "mighty-harmomogram.firebaseapp.com",
    databaseURL: "https://mighty-harmomogram-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mighty-harmomogram",
    storageBucket: "mighty-harmomogram.appspot.com",
    messagingSenderId: "1073706640969",
    appId: "1:1073706640969:web:ea16d6734fe93e1aba0198"
}
// Initialize Firebase
const app = initializeApp(firebaseConfig)
// Get a reference to the database service
const db = getDatabase(app);
export { db };