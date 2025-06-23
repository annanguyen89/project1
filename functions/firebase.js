const admin = require("firebase-admin");

// Initialize Firebase Admin with storage bucket
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: "ai-interview-helper-d2407.firebasestorage.app"
  });
}

module.exports = admin; 