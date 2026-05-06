require("dotenv").config();

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_project_database = process.env.MONGODB_PROJECT_DATABASE;
const mongodb_sessions_database = process.env.MONGODB_SESSIONS_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const { MongoClient } = require('mongodb');
const MONGO_URI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/`;
const client = new MongoClient(MONGO_URI);

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(__dirname + "/"));

//TODO Sessions for login

/*
Example for accessing db:

const res = await fetch("/api/locations");
const locations = await res.json();

^put this into the js code and you'll have all of the documents in an array
*/
app.get('/api/locations', async (req, res) => {
    try {
        const locations = await client.db(mongodb_project_database).collection('Locations').find().toArray();
        res.json(locations);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await client.db(mongodb_project_database).collection('Users').find().toArray();
        res.json(users);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

app.get('/api/sessions', async (req, res) => {
    try {
        const sessions = await client.db(mongodb_sessions_database).collection('sessions').find().toArray();
        res.json(sessions);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});