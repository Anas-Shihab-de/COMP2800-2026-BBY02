# Welcome to FoodHubBC!

BBY-10 has created FoodHubBC as a way to help people manage skyrocketing food costs and locate nearby affordable and nutritious food distributors for those who are health and price conscious. This aligns with our belief in equitable food access to affordable, accessible, and community-focused food assets, such as food pantries, farmers markets, and community food hubs.

## FEATURES

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

### Technologies Used

- The frontend was built entirely using pure HTML, CSS, and JavaScript, with an Express.js backend. All data is stored in a MongoDB database hosted on MongoDB Atlas. This project also uses Mapbox API for map rendering and location selection, and Google Gemini API for the AI-features on the Details page.

## Setup & Troubleshooting

### App Setup

- After cloning the repo, install all necessary dependencies listed in package.json, including express, joi, MongoDB, express-session, and connect-mongo. You will also need to have access to a MongoDB Atlas cluster.
- Before running the app, make sure your .env file includes your MongoDB connection string, MapBox API token, Google Gemini API key, and session secrets.
- Afterwards, open the project folder in your console and run _node app.js_ to host a local instance.

### Common Bugs and Fixes

- If your local changes are not showing up in the browser, you may have an older Node process running in the background. To kill these processes, try running _node | findstr node_, then _taskkill /F /IM node.exe_, and restarting the server with _node app.js_.
- If the map page doesn't load while locally hosting, check your internet connection, make sure you have geolocation enabled in your browswer, and wait up to 30 seconds for Mapbox to load in.

## AI Tools & APIs

- Google Gemini Flash Lite was used for the 'Check Availability' and 'Ask a Question' feature on the Details page.
- The MapBox API was used for the interactive map and radius/location selection on the Map page.

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

## Extra Details \& Considerations

- The current locations and information for them are manually researched online so it may not be fully accurate, especially in matters to do with price.
- AI features use AI. They sometimes hallucinate fake times and are also not always accurate.
- The current hosting site Render is slow, especially when first starting up. If some images are missing or pages are 404'd, try waiting a bit and refreshing.
- The tutorial video shows a slightly earlier version of the app, which is why there is a slight difference in appearance on one or two of the pages. However, these differences are minor and insignificant.
