const admin = require("firebase-admin");

// ========================== Firebase ==========================
const serviceAccount = require("./asistenpurno-bot-firebase-adminsdk-5x8xu-912c2e52bf.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const Note = db.collection('Notes');
module.exports = Note;