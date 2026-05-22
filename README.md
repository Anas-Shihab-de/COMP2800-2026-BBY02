# Welcome to FoodHubBC! ![FoodHubBC Logo](./public/img/sillyFruits.png)

BBY-10 has created [FoodHubBC](https://two800-202610-bby10.onrender.com/) as a way to help people manage skyrocketing food costs and locate nearby affordable and nutritious food distributors for those who are health and price conscious. 

This aligns with our belief in equitable food access to affordable, accessible, and community-focused food assets, such as food pantries, farmers markets, and community food hubs.

![FoodHubBC Demo Video](https://www.youtube.com/watch?v=OtFfpqyDstU)

## Table of Contents
- [About Us](#-about-us)
- [File Structure](#-file-structure)
- [Setup & Troubleshooting](#-setup-&-troubleshooting)
- [Features](#-features)
- [Technologies Used](#-technologies-used)
- [AI Tools & APIs](#-ai-tools-&-apis)
- [Extra Details & Considerations](#-extra-detail-&-considerations)
- [LICENSE](#-license)

## About Us

**Team Name: BBY-10**

**Team Members:**

Anas Shihab
(ashihab2@my.bcit.ca)

Sofia Leustean
(sleustean@my.bcit.ca)

Min Lee
(mlee664@my.bcit.ca)

Damon Cao
(dcao14@my.bcit.ca)

Danielle Laron
(dlaron@my.bcit.ca)

## File Structure

```
project-root/
├── .idea/
├── public/
│   ├── html/
│   ├── css/
│   └── js/
│   └── audio/
│   └── img/
│   └── resource/
├── app.js
├── .gitattributes
├── .gitignore
├── LICENSE
├── README.md
├── app.js
├── package-lock.json
└── package.json
```

## Setup & Troubleshooting

### App Setup

**Note:** You need your own MongoDB Atlas cluster to run your own app.

Use any IDE, [VSCode](https://code.visualstudio.com/download) is a pretty safe pick.

Create your own .env file! Using your MongoDB Atlas connection string, enter .env values following mongodb+srv://{MONGODB_USER}:{MONGODB_PASSWORD}@{MONGODB_HOST}/
```
MONGODB_HOST=
MONGODB_USER=
MONGODB_PASSWORD=
MONGODB_PROJECT_DATABASE={Name of primary database containing users and locations documents}
MONGODB_SESSIONS_DATABASE={Name of sessions database}
MONGODB_SESSION_SECRET={Generate your own GUID}
NODE_SESSION_SECRET={Generate your own GUID}
MAPBOX_TOKEN={Use a public token at https://docs.mapbox.com/help/dive-deeper/access-tokens/}
GEMINI_API_KEY={With your Google account you can get a free Gemini API key at https://ai.google.dev/gemini-api/docs/api-key}

```
Run the following in the terminal of wherever you plan to install the app.
```
# Open a terminal (Command Prompt or PowerShell for Windows, Terminal for macOS or Linux)

# Check if Git is installed (install at https://git-scm.com)
git --version

# Clone the repository
git clone https://github.com/Anas-Shihab-de/2800-202610-BBY10.git

# Navigate to the project directory
cd 2800-202610-BBY10
```
Add your .env to the 2800-202610-BBY10 folder and then run the following.
```
# Install dependencies
npm install

# Run a local instance (after you've set up your .env, instructions below)
node app.js

```

### Common Bugs and Fixes

- If your local changes are not showing up in the browser, you may have an older Node process running in the background. To kill these processes, try running _node | findstr node_, then _taskkill /F /IM node.exe_, and restarting the server with _node app.js_.
- If the map page doesn't load while locally hosting, check your internet connection, make sure you have geolocation enabled in your browswer, and wait up to 30 seconds for Mapbox to load in.

## Features

### Filters \& Personalization

- A visual map allowing you to set your location and distance preference so you can find nearby food locations within a chosen distance.
- A segmented list of food pantries, farmers markets, and other local markets. Filtered and ranked by distance from you as well as other filters.
- Tags on each location allowing you to further filter your preferences and find exactly what you're looking for.
- Situational filters to answer common needs (ex. 'I need wheelchair access', 'I don't have ID', etc.)
- The ability to save locations in your own list so you can find your favourite locations easily.

### Finding Information

- Detailed pages with information on each location including distance, address, and additional notes (ex. limited to people living in New Westminster)
- An 'Ask AI' button that allows you to chat with AI about any other details not mentioned on the page.
- A 'Check Schedule' button that double-checks if a location is open today, useful for grey areas like holidays

### App Accessibility

- An in-app tutorial for new users so that they know how to use the app to find what they need.
- A settings page allowing you to change any preferences (change location, preferred distance, etc.)
- A thematic and visually appealing design for both mobile and desktop users.

## Technologies Used

### Frontend
HTML, CSS, JavaScript
### Backend
Node.js, Express.js
### Database 
MongoDB (database server hosted on MongoDB Atlas)
### Hosting 
Render (free package)
### Node Packages Installed
- @google/generative-ai (v0.24.1)
- bcrypt (v6.0.0)
- connect-mongo (v6.0.0)
- dotenv (v17.4.2)
- express (v5.2.1)
- express-session (v1.19.0)
- joi (v18.2.1)
- mapbox-gl (v3.23.1)
- mongo-sanitizer (v1.0.4)
- mongodb (v7.2.0)
- node (v22.22.3)

## AI Tools & APIs

- Copilot (as a VSCode extension) was used for the AI popup challenge to review code and implement the 'Ask AI' feature.
- Google Gemini Flash Lite was used for the 'Check Availability' and 'Ask a Question' feature on the Details page.
- The MapBox API was used for the interactive map and radius/location selection on the Map page.

## Extra Details & Considerations

- The current locations and information for them are manually researched online so it may not be fully accurate, especially in matters to do with price.
- AI features use AI. They sometimes hallucinate fake times and are also not always accurate.
- The current hosting site Render is slow, especially when first starting up. If some images are missing or pages are 404'd, try waiting a bit and refreshing.
- The tutorial video shows a slightly earlier version of the app, which is why there is a slight difference in appearance on one or two of the pages. However, these differences are minor and insignificant.
- To access the hidden easter egg, take a closer look at the logo on the Home page

## LICENSE

MIT License

Copyright (c) 2026 Anas Shihab

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
