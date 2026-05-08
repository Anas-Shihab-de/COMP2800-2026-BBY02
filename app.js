require("dotenv").config();

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_project_database = process.env.MONGODB_PROJECT_DATABASE;
const mongodb_sessions_database = process.env.MONGODB_SESSIONS_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const bcrypt = require("bcrypt");
const saltRounds = 12;

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const { MongoClient } = require('mongodb');
const MONGO_URI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/`;
const client = new MongoClient(MONGO_URI);

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(__dirname + "/src"));

// TODO tasks for login:
// - Add sessions
// - Add sanitizer and joi to prevent nosql injection

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

app.post('/api/signup', async (req, res) => {
    const username = req.body.signupName;
    const email = req.body.signupEmail;
    const password = req.body.signupPassword;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    try {
        const usersCollection = await client.db(mongodb_project_database).collection('Users');
        await usersCollection.insertOne({"username": username, "email": email, "password": hashedPassword});
        res.redirect("/about"); // Sends to about.html if successful for testing, change in future
    } catch (error) {
        res.status(503).send('Error adding to userbase');
    }
});

app.post('/api/login', async (req, res) => {
    const username = req.body.loginName;
    const password = req.body.loginPassword;
    try {
        const usersCollection = await client.db(mongodb_project_database).collection('Users');
        const result = await usersCollection.find({"username": username}).toArray();
        if (result.length > 0 && await bcrypt.compare(password, result[0].password)) {
            res.redirect("/about");
        } else {
            res.redirect("/Login");
        }
    } catch (error) {
        res.status(503).send('Error logging in');
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/src/Index.html');
});

app.get('/See_All_Locations', (req, res) => {
    res.sendFile(__dirname + '/src/See_All_Locations.html');
});

app.get('/Login', (req, res) => {
    res.sendFile(__dirname + '/src/Log_In_Page.html');
});

app.get('/Sign_Up', (req, res) => {
    res.sendFile(__dirname + '/src/Sign_Up_Page.html');
});

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});