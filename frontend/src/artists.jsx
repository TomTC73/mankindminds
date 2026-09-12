import React, { useState } from "react";

// Mock dataset for individual artists
export const ARTISTS_DATA = [
  {
    id: "artist-isabella-sala",
    name: "Isabella Sala",
    handle: "@isabellasalatattoos",

    instagram: {
      url: "https://www.instagram.com/isabellasalatattoos/",
      icon: "/icons/instagram.png",   // ← your PNG icon
      handle: "@isabellasalatattoos"
    },

    website: "https://www.isabellasalatattoos.it/",
    studio: "Isabella Sala Tattoos",
    location: "Italy",
    styles: ["Fine Line", "Minimalist", "Delicate Blackwork"],
    bio: "Italian fine-line tattoo artist known for elegant, minimalist designs with soft detailing and clean precision.",
    rating: "4.9",
    verified: true,

    portfolio: [
      { id: 1, type: "image", url: "/Artist1work/shot1_r5_c5.png" },
      { id: 2, type: "image", url: "/Artist1work/shot1_r5_c6.png" },
      { id: 3, type: "image", url: "/Artist1work/shot1_r6_c1.png" },
      { id: 4, type: "image", url: "/Artist1work/shot1_r6_c2.png" },
      { id: 5, type: "image", url: "/Artist1work/shot1_r6_c3.png" },
      { id: 6, type: "image", url: "/Artist1work/shot1_r6_c4.png" },
      { id: 7, type: "image", url: "/Artist1work/shot1_r6_c6.png" },
      { id: 8, type: "image", url: "/Artist1work/shot2_r1_c1.png" },
      { id: 9, type: "image", url: "/Artist1work/shot2_r1_c2.png" },
      { id: 10, type: "image", url: "/Artist1work/shot2_r1_c3.png" },
      { id: 11, type: "image", url: "/Artist1work/shot2_r1_c5.png" },
      { id: 12, type: "image", url: "/Artist1work/shot2_r1_c6.png" },
      { id: 13, type: "image", url: "/Artist1work/shot2_r2_c1.png" },
      { id: 14, type: "image", url: "/Artist1work/shot2_r2_c2.png" },
      { id: 15, type: "image", url: "/Artist1work/shot2_r2_c3.png" },
      { id: 16, type: "image", url: "/Artist1work/shot2_r2_c4.png" },
      { id: 17, type: "image", url: "/Artist1work/shot2_r2_c6.png" },
      { id: 18, type: "image", url: "/Artist1work/shot3_r1_c1.png" },
      { id: 19, type: "image", url: "/Artist1work/shot3_r1_c2.png" },
      { id: 20, type: "image", url: "/Artist1work/shot3_r1_c3.png" },
      { id: 21, type: "image", url: "/Artist1work/shot3_r1_c5.png" },
      { id: 22, type: "image", url: "/Artist1work/shot3_r1_c6.png" },
      { id: 23, type: "image", url: "/Artist1work/shot3_r2_c1.png" },
      { id: 24, type: "image", url: "/Artist1work/shot3_r2_c2.png" },
      { id: 25, type: "image", url: "/Artist1work/shot3_r2_c3.png" },
      { id: 26, type: "image", url: "/Artist1work/shot3_r2_c4.png" },
      { id: 27, type: "image", url: "/Artist1work/shot3_r2_c6.png" },
      { id: 28, type: "image", url: "/Artist1work/shot3_r3_c1.png" },
      { id: 29, type: "image", url: "/Artist1work/shot3_r3_c2.png" },
      { id: 30, type: "image", url: "/Artist1work/shot3_r3_c4.png" },
      { id: 31, type: "image", url: "/Artist1work/shot3_r3_c5.png" }
    ]
  }
];




export default function Artists({ onNavigateToStudios }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("All");

  const stylesList = ["All", "Fine Line", "Micro-realism", "Neo-Traditional", "Blackwork", "Japanese"];

  const filteredArtists = ARTISTS_DATA.filter((artist) => {
    const matchesSearch =
      artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.studio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStyle =
      selectedStyle === "All" || artist.styles.includes(selectedStyle);

    return matchesSearch && matchesStyle;
  });

 return (
  <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>

    {/* MAIN SITE NAVIGATION */}
    <nav
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "24px",
        marginBottom: "32px",
        flexWrap: "wrap",
        fontWeight: "600",
        fontSize: "15px",
      }}
    >
      <a href="/tattoos" style={{ textDecoration: "none", color: "#111" }}>Tattoos</a>
      <a href="/music" style={{ textDecoration: "none", color: "#111" }}>Music</a>
      <a href="/writing" style={{ textDecoration: "none", color: "#111" }}>Writing</a>
      <a href="/videos" style={{ textDecoration: "none", color: "#111" }}>Videos</a>
      <a href="/art" style={{ textDecoration: "none", color: "#111" }}>Art</a>
      <a href="/" style={{ textDecoration: "none", color: "#111" }}>Mankind Minds</a>
      <a href="/process/tattoos" style={{ textDecoration: "none", color: "#111" }}>Process</a>
      <a href="/map" style={{ textDecoration: "none", color: "#111" }}>Map</a>
      <a href="/apply" style={{ textDecoration: "none", color: "#111" }}>Apply</a>
    </nav>

    {/* LOCAL NAVIGATION */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "16px",
        marginBottom: "32px",
      }}
    >
      <a
        href="/map"
        style={{
          padding: "10px 18px",
          background: "#111",
          color: "white",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "600",
          fontSize: "15px",
        }}
      >
        ← Back to Studios
      </a>

      <a
        href="/tattoos"
        style={{
          padding: "10px 18px",
          background: "#f3f4f6",
          color: "#111",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "600",
          fontSize: "15px",
        }}
      >
        Home
      </a>

      <a
        href="/apply"
        style={{
          padding: "10px 18px",
          background: "#1b8a5a",
          color: "white",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "600",
          fontSize: "15px",
        }}
      >
        Apply as Artist
      </a>
    </div>

    {/* PAGE TITLE */}
    <h1
      style={{
        fontSize: "36px",
        fontWeight: "800",
        marginBottom: "32px",
        textAlign: "center",
      }}
    >
      Featured Artists
    </h1>

    {/* ARTISTS */}
    {ARTISTS_DATA.map((artist) => (
      <div
        key={artist.id}
        style={{
          marginBottom: "50px",
          padding: "28px",
          borderRadius: "16px",
          background: "#ffffff",
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
          border: "1px solid #ececec",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: "700",
              }}
            >
              {artist.name}
            </h2>

            <p
              style={{
                marginTop: "6px",
                fontSize: "16px",
                color: "#555",
                maxWidth: "600px",
              }}
            >
              {artist.bio}
            </p>

            <p
              style={{
                marginTop: "8px",
                fontSize: "15px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Styles:{" "}
              <span style={{ fontWeight: "500" }}>
                {artist.styles.join(", ")}
              </span>
            </p>
          </div>

          {/* Instagram Button */}
          <a
            href={artist.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background:
                "linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)",
              padding: "10px 18px",
              borderRadius: "40px",
              color: "white",
              fontWeight: "600",
              fontSize: "15px",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
          >
            <img
              src={artist.instagram.icon}
              alt="Instagram"
              style={{ width: "20px", height: "20px" }}
            />
            {artist.instagram.handle}
          </a>
        </div>

        {/* Portfolio Grid */}
        <div
          style={{
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "14px",
          }}
        >
          {artist.portfolio.map((item) => (
            <div
              key={item.id}
              style={{
                overflow: "hidden",
                borderRadius: "12px",
                boxShadow: "0 3px 12px rgba(0,0,0,0.10)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 3px 12px rgba(0,0,0,0.10)";
              }}
            >
              <img
                src={item.url}
                alt={`${artist.name} tattoo ${item.id}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);



}