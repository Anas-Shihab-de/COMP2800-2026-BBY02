require("dotenv").config();

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_project_database = process.env.MONGODB_PROJECT_DATABASE;
const mongodb_sessions_database = process.env.MONGODB_SESSIONS_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
const mapboxgl_token = process.env.MAPBOX_TOKEN;

const bcrypt = require("bcrypt");
const saltRounds = 12;

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const { MongoClient } = require("mongodb");
const MONGO_URI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/`;
const client = new MongoClient(MONGO_URI);

const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const Joi = require("joi");
const mongoSanitizer = require("mongo-sanitizer").default;
const expireTime = 24 * 60 * 60 * 1000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + "/public/"));

app.use(mongoSanitizer({ replaceWith: "_" }));

var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_sessions_database}`,
  crypto: {
    secret: mongodb_session_secret,
  },
});

app.use(
  session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
  }),
);

// TODO tasks for login:
// - Add joi to prevent nosql injection

app.get("/", (req, res) => {
  res.redirect("/html/index.html");
});

app.get("/api/authentication", async (req, res) => {
  res.json({
    authenticated: req.session.authenticated,
    email: req.session.email,
  });
});

// Can't process env from browser, so index.html has to fetch it
app.get("/api/mapbox-token", (req, res) => {
  res.json({ token: mapboxgl_token });
});

/*
Example for accessing db:

const res = await fetch("/api/locations");
const locations = await res.json();

^put this into the js code and you'll have all of the documents in an array
*/
app.get("/api/locations", async (req, res) => {
  try {
    const locations = await client
      .db(mongodb_project_database)
      .collection("Locations")
      .find()
      .toArray();
    res.json(locations);
  } catch (error) {
    res.status(500).send("Error fetching data");
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await client
      .db(mongodb_project_database)
      .collection("Users")
      .find()
      .toArray();
    res.json(users);
  } catch (error) {
    res.status(500).send("Error fetching data");
  }
});

app.get("/api/sessions", async (req, res) => {
  try {
    const sessions = await client
      .db(mongodb_sessions_database)
      .collection("sessions")
      .find()
      .toArray();
    res.json(sessions);
  } catch (error) {
    res.status(500).send("Error fetching data");
  }
});

app.post("/api/signup", async (req, res) => {
  const username = req.body.signupName;
  const email = req.body.signupEmail;
  const password = req.body.signupPassword;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  try {
    const usersCollection = await client
      .db(mongodb_project_database)
      .collection("Users");
    await usersCollection.insertOne({
      username: username,
      email: email,
      password: hashedPassword,
      saved_list: [],
    });
    req.session.authenticated = true;
    req.session.email = email;
    req.session.cookie.maxAge = expireTime;
    res.redirect("/html/See_All_Locations.html");
  } catch (error) {
    res.status(503).send("Error adding to userbase");
  }
});

app.post("/api/login", async (req, res) => {
  const username = req.body.loginName;
  const password = req.body.loginPassword;
  try {
    const usersCollection = await client
      .db(mongodb_project_database)
      .collection("Users");
    const result = await usersCollection.find({ username: username }).toArray();
    if (
      result.length > 0 &&
      (await bcrypt.compare(password, result[0].password))
    ) {
      req.session.authenticated = true;
      req.session.email = result[0].email;
      req.session.cookie.maxAge = expireTime;
      res.redirect("/html/See_All_Locations.html");
    } else {
      console.log("login redirect");
      res.redirect("/html/Login.html");
    }
  } catch (error) {
    res.status(503).send("Error logging in");
  }
});

/**
 * saved_page.js : unsave / save the location from the user's saved_list
 *
 * https://www.mongodb.com/docs/drivers/node/current/crud/update/modify/#std-label-node-usage-updateone
 * https://www.mongodb.com/docs/manual/reference/operator/update/push/
 */
app.post("/api/unsave-location", async (req, res) => {
  const locationId = req.body.savedLocationId;
  const userEmail = req.session.email;

  try {
    const usersCollection = await client
      .db(mongodb_project_database)
      .collection("Users");

    const result = await usersCollection.updateOne(
      { email: userEmail }, // filter
      { $pull: { saved_list: locationId } },
    );

    return res.status(200).send("location unsaved");
  } catch (error) {
    console.log(error);
    return res.status(503).send("Error unsaving location");
  }
});

app.post("/api/save-location", async (req, res) => {
  const locationId = req.body.savedLocationId;
  const userEmail = req.session.email;

  try {
    const usersCollection = await client
      .db(mongodb_project_database)
      .collection("Users");

    const result = await usersCollection.updateOne(
      { email: userEmail }, // filter
      { $push: { saved_list: locationId } },
    );

    return res.status(200).send("location saved");
  } catch (error) {
    console.log(error);
    return res.status(503).send("Error saving location");
  }
});

app.use((req, res) => {
  res.status(404).sendFile(__dirname + "/html/404.html");
});

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
