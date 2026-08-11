import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Header from "./Header";

// Favicon path from the public directory
const logoIcon = "/favicon.png";

// Map center and bounds (London)
const LONDON_CENTER = [51.5246, -0.0718];

const LONDON_BOUNDS = [
  [51.25, -0.55], // South-West
  [51.7, 0.3],    // North-East
];

// Helper function to generate a random 5-letter reference code
const generateRefCode = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};

// Studio Location Data
const CREATOR_LOCATIONS = [
  {
    id: 1,
    name: "Cloak & Dagger Tattoo London",
    hubTitle: "Cheshire Street Studio",
    postcode: "E2 6EH",
    refCode: generateRefCode(),
    description: "Custom traditional, black & grey, and vibrant color tattooing.",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5246,
    lng: -0.0688,
  },
  {
    id: 2,
    name: "Seven Doors Tattoo",
    hubTitle: "Fashion Street Studio",
    postcode: "E1 6PX",
    refCode: generateRefCode(),
    description: "Japanese traditional, bold blackwork, and complex compositions.",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5186,
    lng: -0.0718,
  },
  {
    id: 3,
    name: "Princelet Tattoo London",
    hubTitle: "Princelet Street Studio",
    postcode: "E1 5LP",
    refCode: generateRefCode(),
    description: "Fine line tattooing, micro-realism, and custom illustration.",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5202,
    lng: -0.0712,
  },
  {
    id: 4,
    name: "Debut Studios",
    hubTitle: "New Inn Yard Studio",
    postcode: "EC2A 3EY",
    refCode: generateRefCode(),
    description: "Minimalist art, fine line, and modern boutique designs.",
    starRating: 4.7,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5248,
    lng: -0.0805,
  },
  {
    id: 5,
    name: "Happy Sailor",
    hubTitle: "Hackney Road Studio",
    postcode: "E2 7NX",
    refCode: generateRefCode(),
    description: "Classic sailor traditional, bold outlines, and custom flash.",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5273,
    lng: -0.0754,
  },
  {
    id: 6,
    name: "Fifth Dimension Tattoo & Piercing",
    hubTitle: "Bacon Street Studio",
    postcode: "E1 6LF",
    refCode: generateRefCode(),
    description: "Geometric work, fine line, and body piercing services.",
    starRating: 4.6,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5241,
    lng: -0.0708,
  },
  {
    id: 7,
    name: "Top Notch Tattoo & Piercing",
    hubTitle: "Great Eastern Street Studio",
    postcode: "EC2A 3NW",
    refCode: generateRefCode(),
    description: "Walk-ins, custom designs, and body piercings.",
    starRating: 4.7,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5233,
    lng: -0.0801,
  },
  {
    id: 8,
    name: "Reverse Cowgirl Tattoo",
    hubTitle: "Punderson's Gardens Studio",
    postcode: "E2 9QG",
    refCode: generateRefCode(),
    description: "Illustrative art, contemporary fine-line, and modern flash.",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5276,
    lng: -0.0583,
  },
  {
    id: 9,
    name: "East Side Tattoo Studio",
    hubTitle: "Bethnal Green Road Studio",
    postcode: "E2 6DG",
    refCode: generateRefCode(),
    description: "Traditional, custom color pieces, and tooth gems.",
    starRating: 4.7,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5255,
    lng: -0.0658,
  },
  {
    id: 10,
    name: "House of Munshin",
    hubTitle: "Paul Street Studio (24-Hour)",
    postcode: "EC2A 4NE",
    refCode: generateRefCode(),
    description: "Round-the-clock tattooing, walk-ins, fine line, and custom work.",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5252,
    lng: -0.0847,
  },
];

/**
 * Custom Green Leaflet Pin Icon matching the site header logo theme
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
    className: "custom-leaflet-marker",
    iconSize: [38, 50],
    iconAnchor: [19, 50],
    popupAnchor: [0, -45],
  });
};

function MapPage() {
  const customIcon = createCustomPinIcon();

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", backgroundColor: "#ffffff", minHeight: "100vh" }}>
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
            fontWeight: "600",
            fontSize: "28px",
            letterSpacing: "-0.5px",
            color: "#0f172a",
          }}
        >
          Find Certified Studios Near You
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
            zoom={13}
            minZoom={10}
            maxBounds={LONDON_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
          >
            {/* CARTO Positron Light Tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Studio Markers */}
            {CREATOR_LOCATIONS.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={customIcon}
              >
                <Popup minWidth={270} maxWidth={300}>
                  <div style={{ padding: "4px 2px", backgroundColor: "#ffffff", color: "#0f172a" }}>
                    <h3 style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>
                      {loc.name}
                    </h3>
                    <p style={{ margin: "0 0 2px 0", fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                      {loc.hubTitle} | {loc.postcode}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: "#0284c7", fontWeight: "600" }}>
                      Ref Code: {loc.refCode}
                    </p>

                    <p style={{ margin: "0 0 10px 0", fontSize: "12px", lineHeight: "1.4", color: "#334155" }}>
                      {loc.description}
                    </p>

                    {/* Rating & AI Status */}
                    <div
                      style={{
                        display: "flex",
                        justify: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid #e2e8f0",
                        paddingTop: "8px",
                        marginBottom: "10px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      <span style={{ color: "#d97706" }}>
                        Rating: {loc.starRating} / 5.0
                      </span>
                      <span style={{ color: "#475569", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>
                        AI Generated: {loc.aiPercentage}
                      </span>
                    </div>

                    {/* Verified Artists Section (Clean Vertical Scroll) */}
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                      <p style={{ margin: "0 0 8px 0", fontSize: "11px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>
                        VERIFIED ARTISTS
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          maxHeight: "140px",
                          overflowY: "auto",
                          paddingRight: "4px",
                        }}
                      >
                        {loc.artists.map((artist, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: "100%",
                              backgroundColor: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justify: "space-between",
                              padding: "8px 12px",
                              boxSizing: "border-box",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                            }}
                          >
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>
                              {artist}
                            </span>
                            <a
                              href={`/CreatorApplication?ref=${loc.refCode}`}
                              style={{
                                fontSize: "12px",
                                color: "#2563eb",
                                textDecoration: "underline",
                                fontWeight: "500",
                                cursor: "pointer",
                                marginLeft: "8px",
                                whiteSpace: "nowrap"
                              }}
                            >
                              Verify Yourself
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default MapPage;