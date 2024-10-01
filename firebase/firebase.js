const firebase = require('firebase-admin')
const serviceAccount = require('../firebase.json')
require('dotenv').config()
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL:process.env.db_url
});
const messaging = firebase.messaging()
const auth = firebase.auth()
module.exports = {messaging,auth}