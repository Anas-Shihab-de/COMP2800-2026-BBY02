// Check if authenticated
async function checkAuth() {
  const res = await fetch("/api/authentication");
  const auth = await res.json();
  if (!auth.authenticated) {
    window.location.href = "../html/Login.html";
  }
}
checkAuth();

// Source - https://stackoverflow.com/a/901144
// Posted by Artem Barger, modified by community. See post 'Timeline' for change history
// Retrieved 2026-05-13, License - CC BY-SA 4.0
const urlParams = new URLSearchParams(window.location.search);
const locationId = urlParams.get('locationId');

let currentLocation = null;


/**
 * Loads in locations from the database.
 */
async function loadLocation() {
  const res = await fetch("/api/locations");
  const locations = await res.json();
  currentLocation = locations.find(loc => loc._id === locationId);
  if (!currentLocation) {
    document.getElementById("mainPage").innerHTML = "<p>Location not found.</p>";
    return;
  } else {
    await renderPage(currentLocation);
  }
}
loadLocation();

// Pop-up challenge: initially written by Damon, then asked Copilot to improve/refactor the code.
// Copilot improved it by adding checks to errors, using safer practice like encodeURIComponent(), and removing redundant code like a duplicate fetch for location info.
// It also added extra stuff it was not asked to do like checking hours, but it was removed since it was inaccurate and not needed.
async function checkAvailability() {
    const btn = document.getElementById("availabilityBtn");
    const text = document.getElementById("AIOutput");
    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Checking...";
    text.value = "";

    try {
        if (!currentLocation) {
            throw new Error("Location not loaded");
        }

        const res2 = await fetch(
            `/api/ai/schedule/${encodeURIComponent(currentLocation.name)}/${encodeURIComponent(currentLocation.address)}`
        );

        if (!res2.ok) {
            throw new Error(`AI request failed with status ${res2.status}`);
        }

        const response = await res2.json();
        text.value = response?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No availability information was returned.";
    } catch (error) {
        console.error(error);
        text.value = "Unable to check availability right now. Please try again later.";
    } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
    }
}

// TODO chat function

/**
 * 
 * @param {*} locations 
 */
function renderPage(location) {
    const page = document.getElementById("mainPage");
    page.insertAdjacentHTML("beforeend", `
        <section class="header">
            <img src="${location.images[0]}" />

            <div class="headerButtons">
            <button class="backIcon"><img src="../img/BackIcon.png" /></button>

            <button class="bookmarkIcon">
                <img src="../img/BookmarkIcon.png" />
            </button>
            </div>
        </section>

        <div class="backdrop"></div>

        <section class="detailsBox">
            <div class="headingSection">
            <div class="headingBlock">
                <h1 class="locationName">${location.name}</h1>
                <p class="location">Pitt Meadows, BC</p>
                <div class="relativePrice">$$</div>
            </div>
            </div>

            <div class="addressNumberSection">
            <div class="addressBlock">
                <span class="addressLine">${location.address}</span>
            </div>

            <div class="phoneBlock">(604) 521-4242</div>
            </div>

            <div class="scheduleDistanceSection">
            <div class="scheduleBlock">
                <div class="dateAndTimeIcon">
                <img src="../img/DateTimeIcon.png" />
                </div>

                <div class="dateAndTime">
                <span>Saturday</span>
                <span>12:30–2:00 p.m.</span>
                </div>
            </div>

            <div class="distanceBlock">
                <img src="../img/DistanceIconWhite.png" />
                <span class="distance">5 km</span>
            </div>
            </div>

            <section class="importantSection">
            <div class="importantHeading">Important Information</div>
            <ul class="importantList">
                ${location.notes.map(note => {
                return '<li>' + note + '</li>'
                }).join('')}
            </ul>
            </section>

            <div class="redirectInfo">
            <a href="${location.links[0]}" class="redirectLink">
                <img src="../img/RedirectIcon.png" />
                <span>See more on the website</span>
            </a>
            </div>

            <button id="chatBtn">What Can I Expect?</button>
            <button onclick="checkAvailability()" id="availabilityBtn">Check Availability</button>
            <textarea id="AIOutput" rows="6"></textarea>
        </section>

        <!-- Chat Overlay -->
        <div id="chatOverlay" class="chat-overlay">
            <div class="chat-container">
                <div class="chat-header">
                    <h3>Ask about this location</h3>
                    <button id="closeChatBtn" class="close-btn">&times;</button>
                </div>
                <div id="chatMessages" class="chat-messages"></div>
                <div class="chat-input-container">
                    <input type="text" id="chatInput" placeholder="Ask about vegan food, pricing, etc..." maxlength="200">
                    <button id="sendChatBtn">Send</button>
                </div>
            </div>
        </div>
        </div>
    `);
    setupChatEventListeners();
}

// Chat functionality setup
function setupChatEventListeners() {
    const chatBtn = document.getElementById('chatBtn');
    const chatOverlay = document.getElementById('chatOverlay');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatMessages = document.getElementById('chatMessages');

    if (!chatBtn || !chatOverlay) return; // Elements not yet rendered

    // Open chat overlay
    chatBtn.addEventListener('click', function() {
        chatOverlay.style.display = 'block';
        chatInput.focus();
    });

    // Close chat overlay
    closeChatBtn.addEventListener('click', function() {
        chatOverlay.style.display = 'none';
    });

    // Close overlay when clicking outside
    chatOverlay.addEventListener('click', function(e) {
        if (e.target === chatOverlay) {
            chatOverlay.style.display = 'none';
        }
    });

    // Send message on button click
    sendChatBtn.addEventListener('click', sendChatMessage);

    // Send message on Enter key
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    async function sendChatMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');
        chatInput.value = '';
        sendChatBtn.disabled = true;
        sendChatBtn.textContent = 'Sending...';

        try {
            const response = await fetch(
                `/api/ai/chat/${encodeURIComponent(currentLocation.name)}/${encodeURIComponent(currentLocation.address)}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question: message })
                }
            );

            if (!response.ok) {
                throw new Error(`Chat request failed with status ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                "Sorry, I couldn't generate a response right now.";

            addMessage(aiResponse, 'ai');
        } catch (error) {
            console.error('Chat error:', error);
            addMessage("Sorry, I'm having trouble responding right now. Please try again.", 'ai');
        } finally {
            sendChatBtn.disabled = false;
            sendChatBtn.textContent = 'Send';
        }
    }

    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Chat functionality
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners are now set up in setupChatEventListeners() called from renderPage
});