import React, { useState, useEffect } from "react";
import { API_URL, resolveCreatorImageUrl } from "./apiConfig";

// Fallback dataset for individual artists if offline
export const ARTISTS_DATA = [
  {
    id: "artist-isabella-sala",
    slug: "isabella-sala",
    name: "Isabella Sala",
    handle: "@isabellasalatattoos",
    category: "Tattooist",
    imageUrl: "/Artist1work/shot1_r5_c5.png",
    instagram: {
      url: "https://www.instagram.com/isabellasalatattoos/",
      icon: "/icons/instagram.png",
      handle: "@isabellasalatattoos"
    },
    website: "https://www.isabellasalatattoos.it/",
    studio: "Isabella Sala Tattoos",
    location: "Italy",
    styles: ["Fine Line", "Minimalist", "Delicate Blackwork"],
    summary: "Italian fine-line tattoo artist known for elegant, minimalist designs with soft detailing and clean precision.",
    bio: "Italian fine-line tattoo artist known for elegant, minimalist designs with soft detailing and clean precision.",
    rating: "4.9",
    verified: true
  }
];

export default function Artists() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("All");
  const [creators, setCreators] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/creators`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch creators");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const tattooArtists = data.filter((c) =>
            c.category?.toLowerCase().includes("tattoo") ||
            c.category?.toLowerCase().includes("tattooist") ||
            (c.styles && c.styles.length > 0)
          );
          setCreators(tattooArtists.length > 0 ? tattooArtists : data);
        }
      })
      .catch(() => {});
  }, []);

  const artistsList = creators.length > 0 ? creators : ARTISTS_DATA;

  const stylesList = ["All", "Fine Line", "Micro-realism", "Neo-Traditional", "Blackwork", "Japanese", "Minimalist", "Delicate Blackwork"];

  const filteredArtists = artistsList.filter((artist) => {
    const name = artist.name || "";
    const handle = artist.handle || "";
    const studio = artist.studio || "";
    const styles = artist.styles || [];

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStyle =
      selectedStyle === "All" || styles.includes(selectedStyle);

    return matchesSearch && matchesStyle;
  });

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
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
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "800",
            margin: "0 0 12px 0",
            color: "#0f172a",
          }}
        >
          Featured Verified Artists
        </h1>
        <p style={{ color: "#64748b", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
          Discover handpicked, AI-free verified tattoo artists. Click on any artist tab to view their full profile, bio, and verified artwork portfolio.
        </p>
      </div>

      {/* SEARCH AND FILTER CONTROLS */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <input
          type="text"
          placeholder="Search artists by name, handle, or studio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "480px",
            padding: "12px 18px",
            fontSize: "15px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            outline: "none",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
          {stylesList.map((style) => (
            <button
              key={style}
              onClick={() => setSelectedStyle(style)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: selectedStyle === style ? "#0f172a" : "#f1f5f9",
                color: selectedStyle === style ? "#ffffff" : "#475569",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* ARTISTS TABS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "28px",
        }}
      >
        {filteredArtists.map((artist) => {
          const artistSlug = artist.slug || artist.id || "artist";
          const profileUrl = `/creators/${artistSlug}`;
          const artistImg = resolveCreatorImageUrl(
            artist.imageUrl || (artist.portfolio && artist.portfolio[0]?.url)
          );
          const artistStyles = artist.styles || [];

          return (
            <div
              key={artist.id || artist.slug}
              onClick={() => { window.location.href = profileUrl; }}
              style={{
                borderRadius: "18px",
                backgroundColor: "#ffffff",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                cursor: "pointer",
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 14px 32px rgba(15, 23, 42, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(15, 23, 42, 0.08)";
              }}
            >
              {/* Cover / Avatar */}
              <div style={{ position: "relative", height: "220px", backgroundColor: "#f8fafc", overflow: "hidden" }}>
                {artistImg ? (
                  <img
                    src={artistImg}
                    alt={artist.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    No Preview Available
                  </div>
                )}
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.92)",
                    backdropFilter: "blur(4px)",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#1B8A5A",
                  }}
                >
                  ✓ AI-Free Verified
                </span>
              </div>

              {/* Info Body */}
              <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                  <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>
                    {artist.name}
                  </h2>
                  {artist.rating && (
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#d97706" }}>
                      ★ {artist.rating}
                    </span>
                  )}
                </div>

                <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                  {artist.studio || "Tattoo Studio"} {artist.location ? `• ${artist.location}` : ""}
                </p>

                <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#334155", lineHeight: "1.5", flex: 1 }}>
                  {artist.summary || artist.bio}
                </p>

                {artistStyles.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                    {artistStyles.map((style) => (
                      <span
                        key={style}
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#475569",
                          backgroundColor: "#f1f5f9",
                          padding: "4px 10px",
                          borderRadius: "12px",
                        }}
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                )}

                <a
                  href={profileUrl}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 18px",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "14px",
                    textDecoration: "none",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  View Profile & Portfolio →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}