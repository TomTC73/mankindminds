import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Header from "./Header";
import logoIcon from "./assets/favicon.png"; // Your site logo / favicon

// Coordinates
const LONDON_CENTER = [51.5074, -0.1278];

// Bounding box bounds formatted for Leaflet: [[south, west], [north, east]]
const LONDON_BOUNDS = [
  [51.25, -0.55], // South-West
  [51.7, 0.3],    // North-East
];

const CREATOR_LOCATIONS = [
  { id: 1, title: "Central Creator Hub", lat: 51.5074, lng: -0.1278 },
  { id: 2, title: "Camden Creator Hub", lat: 51.5390, lng: -0.1426 },
  { id: 3, title: "Greenwich Creator Hub", lat: 51.4826, lng: -0.0077 },
  { id: 4, title: "Richmond Creator Hub", lat: 51.4613, lng: -0.3037 },
];

/**
 * Custom Leaflet Icon that recreates your green custom pin
 * with the logo floating inside it.
 */
const createCustomPinIcon = () => {
  const iconHtml = `
    <div style="
      position: relative; 
      width: 38px; 
      height: 50px; 
      cursor: pointer; 
      filter: drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.25));
    ">
      <svg width="38" height="50" viewBox="0 0 38 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 0C8.50659 0 0 8.50659 0 19C0 32.25 19 50 19 50C19 50 38 32.25 38 19C38 8.50659 29.4934 0 19 0Z" fill="#1B8A5A"/>
        <circle cx="19" cy="18" r="12" fill="#FFFFFF"/>
      </svg>
      <img src="${logoIcon}" style="
        position: absolute;
        top: 9px;
        left: 10px;
        width: 18px;
        height: 18px;
        object-fit: contain;
        border-radius: 50%;
      " />
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: "custom-leaflet-marker", // Custom class to avoid default background styling
    iconSize: [38, 50],
    iconAnchor: [19, 50], // Bottom tip of the pin points to exact coordinates
    popupAnchor: [0, -45], // Position popup directly above pin
  });
};

function MapPage() {
  const customIcon = createCustomPinIcon();

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Header />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "60px 20px",
        }}
      >
        <h2
          style={{
            marginBottom: "24px",
            fontWeight: "500",
            fontSize: "28px",
            letterSpacing: "-0.5px",
            color: "#0f172a",
          }}
        >
          Find Certified Creators Near You
        </h2>

        {/* Map Container Box */}
        <div
          style={{
            width: "100%",
            maxWidth: "1000px",
            height: "550px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            backgroundColor: "#f8f9f9",
            overflow: "hidden",
          }}
        >
          <MapContainer
            center={LONDON_CENTER}
            zoom={11}
            minZoom={10}
            maxBounds={LONDON_BOUNDS}
            maxBoundsViscosity={1.0} // Locks panning to London area
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
          >
            {/* CARTO Positron Light Map Tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Creator Markers */}
            {CREATOR_LOCATIONS.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={customIcon}
              >
                <Popup>{loc.title}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default MapPage;