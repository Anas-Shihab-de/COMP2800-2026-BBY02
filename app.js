require("dotenv").config();

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_project_database = process.env.MONGODB_PROJECT_DATABASE;
const mongodb_sessions_database = process.env.MONGODB_SESSIONS_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
const mapboxgl_token = process.env.MAPBOX_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

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

const { GoogleGenerativeAI } = require("@google/generative-ai");
const ai = new GoogleGenerativeAI(apiKey);
const model = ai.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

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

// TODO add routes because the server is falling to 404 automatically

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

app.get("/api/ai/schedule/:location/:address", async (req, res) => {
  const dateUTC = new Date(Date.now());
  const dateLocal = dateUTC.toLocaleDateString();

  const message = `Is ${req.params.location} open today (Address: ${req.params.address}? Note: if the location or address is undefined, please respond 'location/address is undefined'.`;
  try {
    const result = await model.generateContent({
      contents: [{
        "parts": [{
          "text": message
        }],
        "role": "user"
      }],
      systemInstruction: `Today is ${dateLocal}. You need to give information on whether a given location is open or not and a reason why (doesn't open on a certain day, not correct season, etc.)`
    });
    const response = await result.response;
    res.json(response);
  } catch (error) {
    console.log(error);
    res.json(null);
  }
});

app.post("/api/ai/chat/:location/:address", async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: "Question is required and must be a non-empty string." });
  }

  const location = req.params.location;
  const address = req.params.address;

  if (!location || !address) {
    return res.status(400).json({ error: "Location and address parameters are required." });
  }

  // Guardrails: Check if the question is related to the location
  const guardrailPrompt = `Analyze this question: "${question}"
  Is this question asking about the restaurant/location "${location}" at "${address}"?
  Answer only "YES" or "NO". If it's asking about food, pricing, atmosphere, service, hours, menu, or any aspect of this specific location, answer YES.
  If it's asking about unrelated topics like geography, science, history, or general knowledge not related to this location, answer NO.`;

  try {
    const guardrailResult = await model.generateContent({
      contents: [{
        "parts": [{ "text": guardrailPrompt }],
        "role": "user"
      }],
      systemInstruction: "You are a strict guardrail system. Only respond with YES or NO based on whether the question is about the specific restaurant/location provided."
    });

    const guardrailResponse = await guardrailResult.response;
    const guardrailText = guardrailResponse.text().trim().toUpperCase();

    if (guardrailText !== 'YES') {
      return res.json({
        candidates: [{
          content: {
            parts: [{
              text: "I'm sorry, I can only answer questions about this specific location. Please ask about the food, pricing, atmosphere, or other details related to this restaurant."
            }]
          }
        }]
      });
    }

    // If guardrail passes, generate the actual response
    const chatPrompt = `You are a helpful assistant answering questions about the restaurant "${location}" located at "${address}".

Question: ${question}

Please provide a helpful, accurate response based on what you know about restaurants and typical dining experiences. Keep your response concise and relevant to the location.`;

    const result = await model.generateContent({
      contents: [{
        "parts": [{ "text": chatPrompt }],
        "role": "user"
      }],
      systemInstruction: `You are answering questions about a specific restaurant location. Provide helpful information about food, pricing, atmosphere, service, or other restaurant-related topics. Keep responses concise and focused on the dining experience.`
    });

    const response = await result.response;
    res.json(response);
  } catch (error) {
    console.log('Chat API error:', error);
    res.status(500).json({
      candidates: [{
        content: {
          parts: [{
            text: "Sorry, I'm having trouble processing your question right now. Please try again later."
          }]
        }
      }]
    });
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

// app.use((req, res) => { until routes are added
//   res.status(404).sendFile(__dirname + "/html/404.html");
// });

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
