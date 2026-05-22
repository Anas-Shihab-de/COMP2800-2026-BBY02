# Welcome to FoodHubBC!

BBY-10 has created FoodHubBC as a way to help people manage skyrocketing food costs and locate nearby affordable and nutritious food distributors for those who are health and price conscious. This aligns with our belief in equitable food access to affordable, accessible, and community-focused food assets, such as food pantries, farmers markets, and community food hubs.

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

## FEATURES

### Filters \& Personalization

- An visual map allowing you to set your location and distance preference so you can find nearby food locations in a chosen distance.
- A segmented list of food pantries, farmers markets, and other local markets. Filtered and ranked by distance from you as well as other filters.
- Tags on each location allowing you to filter your preferences even more and find exactly what you're looking for.
- Situational filters to answer common needs (ex. 'I need wheelchair access', 'I don't have ID', etc.)
- The ability to save locations in your own list so you can find your favourite locations easily.

### Finding Information

- Detailed pages with information on each location including distance, address, and extra notes (ex. limited to people living in New Westminster)
- An 'Ask AI' button that allows you to chat with an AI about any other details not mentioned on the page.
- A 'Check Schedule' button that double-checks if a location is open today, useful for grey areas like holidays

### App Accessibility

- An in-app tutorial for new users so that they know how to use the app to find what they need.
- A settings page allowing you to change any preferences (change location, preferred distance, etc.)
- A thematic and visually appealing design for both mobile and desktop users.

## Setup & Troubleshooting

### App Setup
- Once you make a clone of the repository, install the corresponding dependencies (mongoDB, express, joi, express-session, connect-mongo, etc.)
- Open the project folder, open it in the console, and run *node app.js* to host a local instance
- To test app features, log into our test account (User: test001, pass: test)

### Common Bugs and Fixes

- If, while local hosting, changes do not appear on the page; run *node | findstr node* then *taskkill /F /IM node.exe* followed by *node ap.js*, this kills the node instance and re-runs it so the local host uses the most recent code
- If, while local hosting, the map page doesn't render, check your internet connection, ensure geolocation is allowed in the browser and wait up to 30 seconds 
 
## AI Tools & API's 

### AI Tools

- Google Gemini flash lite is used for the AI ask availability and ask a question features

### API Usage

- The Google Gemini and Mapbox API's are used for the details page, map, and settings page

## About Us

**Team Name: BBY-10**

**Team Members:**

Sofia Leustean

Anas Shihab

Min Lee

Damon Cao

Danielle Laron

## Extra Details \& Considerations

- The current locations and information for them are manually researched online so it may not be fully accurate, especially in fields like price.
- AI features use AI. They sometimes hallucinate fake times and are also not always accurate.
- The current hosting site Render is slow, especially when first starting up. If some images are missing or pages are 404'd, try waiting a bit and refreshing.
