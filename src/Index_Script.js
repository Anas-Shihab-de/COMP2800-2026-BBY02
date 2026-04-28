import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Adds a blue marker for user's location on the map literally
function addUserPin(map, userLocation) {
  new mapboxgl.Marker({ color: "blue" }).setLngLat(userLocation).addTo(map);
}

async function showMap() {
  // Initialize the Mapbox map With access token from .env and initial settings

  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // Attempt to get user's real location or default if not available

  const userLocation = await getUserLocation();

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: userLocation,
    zoom: 19,
  });

  // When the user clicks the map get the route from
  // the user's location to the clicked location

  getClickedLocation(map, (clickedLocation) => {
    getRoute(map, userLocation, clickedLocation);
  });

  addControls();

  function addControls() {
    map.addControl(new mapboxgl.NavigationControl());
  }

  // When the map is done loading set up the user pin
  map.once("load", () => setupMap(map, userLocation));
  function setupMap(map, userLocation) {
    addUserPin(map, userLocation);
  }
}
window.addEventListener("load", () => {
  showMap();
});

// Detects when the user clicks the map grab the coordinate places the end point there
// and returns that using callback.
function getClickedLocation(map, callback) {
  map.on("click", (event) => {
    const clickedLocation = Object.keys(event.lngLat).map(
      (key) => event.lngLat[key]
    );
    const end = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: clickedLocation,
          },
        },
      ],
    };

    // If the end point exists then replace it with a new one
    // Otherwise, create a new visible circle marker layer.
    if (map.getLayer("end")) {
      map.getSource("end").setData(end);
    } else {
      map.addLayer({
        id: "end",
        type: "circle",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Point",
                  coordinates: clickedLocation,
                },
              },
            ],
          },
        },
        paint: {
          "circle-radius": 10,
          "circle-color": "#f30",
        },
      });
    }

    callback(clickedLocation);
  });
}

// Gets the user's location using the Geolocation API
async function getUserLocation() {
  const defaultLocation = [-123.00163752324765, 49.25324576104826];

  if (!navigator.geolocation) {
    console.log("Geolocation not supported. Using default.");
    return defaultLocation;
  }

  // Wrap the async GPS call inside a Promise so we can use 'await'
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      // So if it work then user location is retrieved
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];

        resolve(coords);
      },

      () => {
        console.log("Geolocation failed. Using default.");

        resolve(defaultLocation);
      }
    );
  });
}

// Uses the Mapbox Directions API to get a walking route from start end.
// Draws the route on the map and fills the sidebar with turn by turn instructions.

async function getRoute(map, start, end) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
    { method: "GET" }
  );

  // Parse the response and extract the route geometry
  const json = await query.json();
  const data = json.routes[0];
  const route = data.geometry.coordinates;
  const geojson = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: route,
    },
  };
  // If the route already exists update it.
  // If not add a new layer to draw the path on the map.

  if (map.getSource("route")) {
    map.getSource("route").setData(geojson);
  } else {
    map.addLayer({
      id: "route",
      type: "line",
      source: {
        type: "geojson",
        data: geojson,
      },
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3887be",
        "line-width": 5,
        "line-opacity": 0.75,
      },
    });
  }

  // get the sidebar and add the instructions
  const instructions = document.getElementById("instructions");
  const steps = data.legs[0].steps;

  let tripInstructions = "";
  for (const step of steps) {
    tripInstructions += `<li>${step.maneuver.instruction}</li>`;
  }
  instructions.innerHTML = `<p><strong>Trip duration: ${Math.floor(
    data.duration / 60
  )} min  </strong></p><ol>${tripInstructions}</ol>`;
}


