// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, update, off, push } from 'firebase/database';
import {
    firebase_apiKey,
    firebase_authDomain,
    firebase_databaseURL,
    firebase_projectId,
    firebase_storageBucket,
    firebase_messagingSenderId,
    firebase_appId,
    firebase_measurementId
} from "@env";

const firebaseConfig = {
    apiKey: firebase_apiKey,
    authDomain: firebase_authDomain,
    databaseURL: firebase_databaseURL,
    projectId: firebase_projectId,
    storageBucket: firebase_storageBucket,
    messagingSenderId: firebase_messagingSenderId,
    appId: firebase_appId,
    measurementId: firebase_measurementId
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, get, onValue, update, off, push };