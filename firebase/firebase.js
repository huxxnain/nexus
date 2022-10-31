const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('./nxus-8dc57-firebase-adminsdk-fd9l2-c7b76fee3e.json');

const storage = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

module.exports = storage;
