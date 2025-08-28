// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, update, off, push } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyB0IZiY_0meRNkcWsU-SFX5it8ZouhnBRk",
    authDomain: "smarttrack-e053b.firebaseapp.com",
    databaseURL: "https://smarttrack-e053b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smarttrack-e053b",
    storageBucket: "smarttrack-e053b.firebasestorage.app",
    messagingSenderId: "669073050721",
    appId: "1:669073050721:web:61b64e6a84eca200d56e20",
    measurementId: "G-WQP4TL0JCQ"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, get, onValue, update, off, push };