import { initializeApp, getApps } from "firebase/app"
import { getDatabase } from "firebase/database"
const firebaseConfig = {
    apiKey: 'AIzaSyBG2kySsHRPsWHLw4QXO1hslFgNDLVJW_4',
    databaseUrl: 'https://mighty-harmomogram-default-rtdb.europe-west1.firebasedatabase.app',
    authDomain: 'mighty-harmomogram.firebaseapp.com',
    projectId: 'mighty-harmomogram',
    storageBucket: 'mighty-harmomogram.appspot.com',
    messagingSenderId: "1073706640969",
    appId: "1:1073706640969:web:ea16d6734fe93e1aba0198"
}
const apps = getApps()
if (!apps.length) {
    var firebaseApp = initializeApp(firebaseConfig)
} else {
    var firebaseApp = apps[0]
}
// Get a reference to the database service
const db = getDatabase(firebaseApp);
export { db };