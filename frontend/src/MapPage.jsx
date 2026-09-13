import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapPage.css";

import Header from "./Header";
import { API_URL, resolveStudioImageUrl, resolveCreatorImageUrl } from "./apiConfig";

const logoIcon = "/favicon.png";

const LONDON_CENTER = [51.5246, -0.0718];
const NORWICH_CENTER = [52.6309, 1.2974];

const LONDON_BOUNDS = [
  [51.25, -0.55],
  [51.7, 0.3],
];

const NORWICH_BOUNDS = [
  [52.45, 1.05],
  [52.80, 1.55],
];
const ALL_BOUNDS = [
  [49.8, -5.8],
  [55.8, 1.8],
];

const generateRefCode = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};

// --- LONDON LOCATIONS ---
const LONDON_LOCATIONS = [
  {
    id: 1,
    name: "Cloak & Dagger Tattoo London",
    hubTitle: "Cheshire Street Studio",
    postcode: "E2 6EH",
    refCode: generateRefCode(),
    image: "/Tatooshops/CloakAndDagger.png",
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
    image: "/Tatooshops/sevenDooorsTatoo.png",
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
    image: "/Tatooshops/PrinclettTatooLondon.png",
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
    image: "/Tatooshops/DebutStudios.png",
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
    image: "/Tatooshops/HappySailorTatoo.png",
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
    image: "/Tatooshops/FifthDimension.png",
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
    image: "/Tatooshops/TopNotchTatoo.png",
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
    image: "/Tatooshops/Reverse.png",
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
    image: "/Tatooshops/EastSideTatoo.png",
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
    image: "/Tatooshops/HouseofMunschin.png",
    description: "Round-the-clock tattooing, walk-ins, fine line, and custom work.",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5252,
    lng: -0.0847,
  },
  {
    id: 11,
    name: "Ink Me Tattoo Studio",
    hubTitle: "Wentworth Street Studio",
    postcode: "E1 7TF",
    refCode: generateRefCode(),
    image: "/Tatooshops/inkmetatoo.png",
    description: "Custom tattooing and flash designs.",
    starRating: 5.0,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5165,
    lng: -0.0741,
  },
  {
    id: 12,
    name: "Lost Fox Tattoo",
    hubTitle: "Charlotte Street Studio",
    postcode: "W1T 4PE",
    refCode: generateRefCode(),
    image: "/Tatooshops/LostFox.png",
    description: "Bespoke fine line and custom illustrations.",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5195,
    lng: -0.1365,
  },
  {
    id: 13,
    name: "Body Canvas",
    hubTitle: "Goodge Street Studio",
    postcode: "W1T 2PL",
    refCode: generateRefCode(),
    image: "/Tatooshops/BodyCanva.png",
    description: "Quality custom artwork and walk-in services.",
    starRating: 5.0,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5198,
    lng: -0.1352,
  },
  {
    id: 14,
    name: "Gypsy Stables Tattoo Collective",
    hubTitle: "Percy Street Studio",
    postcode: "W1T 2DF",
    refCode: generateRefCode(),
    image: "/Tatooshops/GypsyStable.png",
    description: "Eclectic collective offering custom traditional and modern tattoo art.",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5186,
    lng: -0.1348,
  },
  {
    id: 15,
    name: "Tattoo Shop By Dan Gold",
    hubTitle: "Oxford Street Studio",
    postcode: "W1D 1LP",
    refCode: generateRefCode(),
    image: "/Tatooshops/Tatooshopdangold.png",
    description: "Celebrity tattooist Dan Gold offering high-end custom tattoo pieces.",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5161,
    lng: -0.1341,
  },
  {
    id: 16,
    name: "Sixtyink - London Tattoo Studio",
    hubTitle: "Denmark Street Studio",
    postcode: "WC2H 8NJ",
    refCode: generateRefCode(),
    image: "/Tatooshops/sixtyi.png",
    description: "Boutique studio specializing in fine line, blackwork, and color tattoos.",
    starRating: 5.0,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5154,
    lng: -0.1298,
  },
  {
    id: 17,
    name: "The Circle London",
    hubTitle: "Noel Street Studio",
    postcode: "W1F 8GP",
    refCode: generateRefCode(),
    image: "/Tatooshops/The Circle London.png",
    description: "Contemporary tattoo workspace and creative concept studio.",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5146,
    lng: -0.1368,
  },
  {
    id: 18,
    name: "One by One Tattoo",
    hubTitle: "Berwick Street Studio",
    postcode: "W1F 8TA",
    refCode: generateRefCode(),
    image: "/Tatooshops/onebyone.png",
    description: "Soho studio specializing in fine line, realistic, and minimalist tattooing.",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5139,
    lng: -0.1356,
  },
  {
    id: 19,
    name: "The London Social Tattoo - Soho",
    hubTitle: "D'Arblay Street Studio",
    postcode: "W1F 8ER",
    refCode: generateRefCode(),
    image: "/Tatooshops/TheLondonSocialTatoo.png",
    description: "Classic Soho location providing top tier custom tattoo work.",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5142,
    lng: -0.1360,
  },
  {
    id: 20,
    name: "West One Tattoo",
    hubTitle: "Oxford Street Studio",
    postcode: "W1D 2EF",
    refCode: generateRefCode(),
    image: "/Tatooshops/westone.png",
    description: "Walk-ins and bespoke custom designs right on Oxford Street.",
    starRating: 4.7,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5156,
    lng: -0.1311,
  },
  {
    id: 21,
    name: "Frith Street Tattoo",
    hubTitle: "Frith Street Studio",
    postcode: "W1D 4RQ",
    refCode: generateRefCode(),
    image: "/Tatooshops/frithStreet.png",
    description: "Iconic Soho basement studio famous for traditional and bold blackwork.",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5133,
    lng: -0.1312,
  },
  {
    id: 22,
    name: "Tattoo 13",
    hubTitle: "Moor Street Studio",
    postcode: "W1D 5NE",
    refCode: generateRefCode(),
    image: "/Tatooshops/Tatoo13.png",
    description: "Established West End tattoo studio for flash and custom artwork.",
    starRating: 4.7,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5129,
    lng: -0.1299,
  },
  {
    id: 23,
    name: "Seven Dials Tattoo",
    hubTitle: "St Martin's Court Studio",
    postcode: "WC2N 4AL",
    refCode: generateRefCode(),
    image: "/Tatooshops/sevendialstatoo.png",
    description: "Dickensian-style studio offering high-quality custom tattoo designs.",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5108,
    lng: -0.1265,
  },
  {
    id: 24,
    name: "Diamond Jacks Tattoo London",
    hubTitle: "Maiden Lane Studio",
    postcode: "WC2E 7NG",
    refCode: generateRefCode(),
    image: "/Tatooshops/DiamondJane.png",
    description: "Historic Covent Garden studio producing original rock 'n' roll tattoos.",
    starRating: 4.6,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 51.5102,
    lng: -0.1238,
  },
];

// --- NORWICH LOCATIONS ---
const NORWICH_LOCATIONS = [
  {
    id: 101,
    name: "Golden Canary Tattoo",
    hubTitle: "St Augustines Street Studio",
    postcode: "NR3 3BY",
    refCode: generateRefCode(),
    image: "/Tatooshops/Golden-Canary-Tattoo.png",
    description: "The tattoo exceeded all my expectations and the detail is incredible.",
    starRating: 5.0,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6368,
    lng: 1.2917,
  },
  {
    id: 102,
    name: "Inkaddiction",
    hubTitle: "Wensum Street Studio",
    postcode: "NR3 1LA",
    refCode: generateRefCode(),
    image: "/Tatooshops/Wensum Street Studio.png",
    description: "High quality tattooing, relaxed friendly staff, great studio.",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6318,
    lng: 1.2981,
  },
  {
    id: 103,
    name: "Hollow Bones Tattoo Studio",
    hubTitle: "London Street Studio",
    postcode: "NR2 1LA",
    refCode: generateRefCode(),
    image: "/Tatooshops/Hollow Bones.png",
    description: "I saw Jaz for my back tattoo and was blown away with the results.",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6289,
    lng: 1.2943,
  },
  {
    id: 104,
    name: "Factotum",
    hubTitle: "St John Maddermarket Studio",
    postcode: "NR2 1DN",
    refCode: generateRefCode(),
    image: "/Tatooshops/factotum.png",
    description: "Staff were lovely and the tattoo was awesome would recommend x",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6297,
    lng: 1.2932,
  },
  {
    id: 105,
    name: "True Love Tattoos - Norwich",
    hubTitle: "St Gregorys Alley Studio",
    postcode: "NR2 1ER",
    refCode: generateRefCode(),
    image: "/Tatooshops/True Love Tattoos.jpg",
    description: "AMAZING - beautiful, quick tattoo done to remember my late dad.",
    starRating: 5.0,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6298,
    lng: 1.2919,
  },
  {
    id: 106,
    name: "New Leaf Tattoo Norwich",
    hubTitle: "Magdalen Street Studio",
    postcode: "NR3 1JD",
    refCode: generateRefCode(),
    image: "/Tatooshops/New Leaf Tattoo.png",
    description: "This was my first tattoo and Poppy instantly made me feel relaxed and safe.",
    starRating: 5.0,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6352,
    lng: 1.2971,
  },
  {
    id: 107,
    name: "Mother of Pearl Tattoo",
    hubTitle: "Ber Street Studio",
    postcode: "NR1 3EY",
    refCode: generateRefCode(),
    image: "/Tatooshops/Mother of Pearl Tattoo.png",
    description: "Beyond thrilled with my tattoo, perfect design and placement.",
    starRating: 5.0,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6241,
    lng: 1.2979,
  },
  {
    id: 108,
    name: "Cold Iron Tattoo Company",
    hubTitle: "Rose Lane Studio",
    postcode: "NR1 1JY",
    refCode: generateRefCode(),
    image: "/Tatooshops/Cold Iron Tattoo Company.png",
    description: "Amazing artists and very friendly staff",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6272,
    lng: 1.2996,
  },
  {
    id: 109,
    name: "Dark Tattoo Company",
    hubTitle: "City View Road Studio",
    postcode: "NR2 4TN",
    refCode: generateRefCode(),
    image: "/Tatooshops/Dark Tattoo Company.jpg",
    description: "Very friendly service, very relaxed and amazing tattoo.",
    starRating: 5.0,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6415,
    lng: 1.2842,
  },
  {
    id: 110,
    name: "Indigo",
    hubTitle: "St Giles Street Studio",
    postcode: "NR2 1JR",
    refCode: generateRefCode(),
    image: "/Tatooshops/Indigo.png",
    description: "Really professional and welcoming looking to be tattooed here also 😊",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6288,
    lng: 1.2905,
  },
  {
    id: 111,
    name: "Rude Boy Studios",
    hubTitle: "Orford Place Studio",
    postcode: "NR1 3RU",
    refCode: generateRefCode(),
    image: "/Tatooshops/RudeBoyStudios.png",
    description: "Fantastic service, including pre-tattoo advice and aftercare.",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6276,
    lng: 1.2941,
  },
  {
    id: 112,
    name: "Wildflower Tattoo",
    hubTitle: "Ber Street Studio",
    postcode: "NR1 3EY",
    refCode: generateRefCode(),
    image: "/Tatooshops/Mother of Pearl Tattoo.png",
    description: "Funky little shop to get too",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6243,
    lng: 1.2977,
  },
  {
    id: 113,
    name: "Crow Temple Tattoo",
    hubTitle: "Prince of Wales Road Studio",
    postcode: "NR1 1DG",
    refCode: generateRefCode(),
    image: "/Tatooshops/CrowTempleTatoo.png",
    description: "Highly recommended, great work, great artists, always a welcoming vibe.",
    starRating: 5.0,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6279,
    lng: 1.3025,
  },
  {
    id: 114,
    name: "Black Dagger Tattoo",
    hubTitle: "Borrowdale Drive Studio",
    postcode: "NR1 4NS",
    refCode: generateRefCode(),
    image: "/Tatooshops/BlackDaggerTatoo.png",
    description: "A really welcoming tattoo studio with great artists and a friendly service.",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6382,
    lng: 1.3251,
  },
  {
    id: 115,
    name: "Sith Tattoo & Piercing",
    hubTitle: "Dereham Road Studio",
    postcode: "NR2 4HX",
    refCode: generateRefCode(),
    image: "/Tatooshops/SithTatoo&Piercing.png",
    description: "Clean friendly awesome decor and nice artist perfect place",
    starRating: 4.9,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6312,
    lng: 1.2825,
  },
  {
    id: 116,
    name: "Black Plague Tattoo",
    hubTitle: "Pottergate Studio",
    postcode: "NR2 1DX",
    refCode: generateRefCode(),
    image: "/Tatooshops/BlackPlagueTatoo.png",
    description: "Been tattooed here on numerous occasions, always really clean and bright.",
    starRating: 5.0,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6294,
    lng: 1.2918,
  },
  {
    id: 117,
    name: "Cavalry Tattoo Studio",
    hubTitle: "Bank Plain Studio",
    postcode: "NR2 4SF",
    refCode: generateRefCode(),
    image: "/Tatooshops/CalvaryTatoo.png",
    description: "Quick, lovely people (especially Josh), decent price",
    starRating: 4.8,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6283,
    lng: 1.2972,
  },
  {
    id: 118,
    name: "Enter The Void Tattoos",
    hubTitle: "Orford Street Studio",
    postcode: "NR1 3BN",
    refCode: generateRefCode(),
    image: "/Tatooshops/EntertheVoid.png",
    description: "Awesome new design created and 'installed' by the artist that is Gee.",
    starRating: 4.7,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6272,
    lng: 1.2938,
  },
  {
    id: 119,
    name: "Lemon Head Tattoo",
    hubTitle: "King Street Studio",
    postcode: "NR1 1QH",
    refCode: generateRefCode(),
    image: "/Tatooshops/LemonHeadTatoo.png",
    description: "Amazing tattoo space with a quirky interior.",
    starRating: 5.0,
    aiPercentage: "Unverified",
    artists: ["Artist 1", "Artist 2", "Artist 3", "Artist 4"],
    lat: 52.6238,
    lng: 1.3005,
  },
];

// --- FEATURED ARTISTS ---
// Bundled fallback so the Artists tab still renders if the creators API is briefly
// unavailable. New tattooist creators added via the staff manager app are fetched
// from the backend below and merged in automatically — no code changes needed.
const FALLBACK_ARTISTS_DATA = [
  {
    id: "artist-isabella-sala",
    slug: "isabella-sala",
    name: "Isabella Sala",
    creatorSlug: "isabella-sala",
    handle: "@isabellasalatattoos",
    category: "Tattooist",
    imageUrl: "/Artist1work/shot1_r5_c5.png",
    instagram: {
      url: "https://www.instagram.com/isabellasalatattoos/",
      icon: "/icons/instagram.png",
      handle: "@isabellasalatattoos",
    },
    website: "https://www.isabellasalatattoos.it/",
    studio: "Isabella Sala Tattoos",
    location: "Italy",
    styles: ["Fine Line", "Minimalist", "Delicate Blackwork"],
    summary: "Italian fine-line tattoo artist known for elegant, minimalist designs with soft detailing and clean precision.",
    bio: "Italian fine-line tattoo artist known for elegant, minimalist designs with soft detailing and clean precision.",
    rating: "4.9",
    verified: true,
    imageUrl: "/Artist1work/3.PNG",
   portfolio: [
  { id: 1, type: "image", url: "/Artist1work/3.PNG" },
  { id: 2, type: "image", url: "/Artist1work/4.PNG" },
  { id: 3, type: "image", url: "/Artist1work/5.PNG" },
  { id: 4, type: "image", url: "/Artist1work/6.PNG" },
  { id: 5, type: "image", url: "/Artist1work/7.PNG" },
  { id: 6, type: "image", url: "/Artist1work/8.PNG" },
  { id: 7, type: "image", url: "/Artist1work/9.PNG" },
  { id: 8, type: "image", url: "/Artist1work/10.PNG" },
  { id: 9, type: "image", url: "/Artist1work/11.PNG" },
  { id: 10, type: "image", url: "/Artist1work/12.PNG" },
  { id: 11, type: "image", url: "/Artist1work/13.PNG" },
  { id: 12, type: "image", url: "/Artist1work/Capture.PNG" },
  { id: 13, type: "image", url: "/Artist1work/Capture.PNG1.PNG" },
  { id: 14, type: "image", url: "/Artist1work/Capture.PNG2.PNG" },
]

  },
];

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

function MapController({ activeCity }) {
  const map = useMap();

  useEffect(() => {
    if (activeCity === "All") {
      map.setMaxBounds(ALL_BOUNDS);
      map.fitBounds(ALL_BOUNDS, { padding: [20, 20], animate: true, duration: 1.2 });
      return undefined;
    }

    const targetCenter = activeCity === "London" ? LONDON_CENTER : NORWICH_CENTER;
    const targetBounds = activeCity === "London" ? LONDON_BOUNDS : NORWICH_BOUNDS;

    map.setMaxBounds(null);
    map.flyTo(targetCenter, 13, { duration: 1.2 });

    const timer = setTimeout(() => {
      map.setMaxBounds(targetBounds);
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeCity, map]);

  return null;
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const invalidateSize = () => map.invalidateSize();
    const frame = requestAnimationFrame(invalidateSize);

    window.addEventListener("resize", invalidateSize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", invalidateSize);
    };
  }, [map]);

  return null;
}

export default function MapPage({ embedded = false }) {
  const customIcon = createCustomPinIcon();
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerRefs = useRef({});
  const pageTopRef = useRef(null);
  const artistsSectionRef = useRef(null);
  const artistCardRefs = useRef({});

  const [activeSection, setActiveSection] = useState("studios");
  const [activeCity, setActiveCity] = useState("London");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [artistSearchTerm, setArtistSearchTerm] = useState("");
  const [isArtistDropdownOpen, setIsArtistDropdownOpen] = useState(false);
  const [highlightedArtistId, setHighlightedArtistId] = useState(null);
  const [artistsData, setArtistsData] = useState(FALLBACK_ARTISTS_DATA);
  const [studioLocations, setStudioLocations] = useState([
    ...LONDON_LOCATIONS.map((studio) => ({ ...studio, city: "London" })),
    ...NORWICH_LOCATIONS.map((studio) => ({ ...studio, city: "Norwich" })),
  ]);

  const activeLocations =
    activeCity === "All"
      ? studioLocations
      : studioLocations.filter((studio) => studio.city === activeCity);

  const filteredShops = activeLocations.filter((shop) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return false;
    return (
      shop.name.toLowerCase().includes(query) ||
      shop.refCode.toLowerCase().includes(query)
    );
  });

  const artistSuggestions = artistsData.filter((artist) => {
    const query = artistSearchTerm.toLowerCase().trim();
    if (!query) return false;
    const styles = artist.styles || [];
    return (
      artist.name.toLowerCase().includes(query) ||
      (artist.handle || "").toLowerCase().includes(query) ||
      (artist.studio || "").toLowerCase().includes(query) ||
      (artist.location || "").toLowerCase().includes(query) ||
      (artist.styles || []).some((style) => style.toLowerCase().includes(query))
    );
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/creators`)
      .then((response) => {
        if (!response.ok) throw new Error(`Creators request failed: ${response.status}`);
        return response.json();
      })
      .then((creators) => {
        if (cancelled || !Array.isArray(creators)) return;
        const tattooCreators = creators
          .filter((creator) => creator.category?.toLowerCase().includes("tattoo"))
          .map((creator) => {
            const socialLinks = creator.socialLinks || [];
            const instagramLink = socialLinks.find((link) => link.name?.toLowerCase() === "instagram");
            const websiteLink = socialLinks.find((link) => link.name?.toLowerCase() === "website");
            return {
              id: `artist-${creator.slug}`,
              name: creator.name,
              creatorSlug: creator.slug,
              handle: instagramLink?.url ? `@${instagramLink.url.replace(/\/$/, "").split("/").pop()}` : "",
              instagram: instagramLink
                ? { url: instagramLink.url, icon: "/icons/instagram.png", handle: instagramLink.url }
                : null,
              website: websiteLink?.url || "",
              studio: creator.studio || "",
              location: creator.location || "",
              styles: creator.styles && creator.styles.length > 0 ? creator.styles : [],
              bio: creator.bio || creator.description || "",
              rating: creator.rating || "",
              verified: true,
              imageUrl: resolveCreatorImageUrl(creator.imageUrl),
              portfolio: (creator.gallery || []).map((url, index) => ({
                id: index + 1,
                type: "image",
                url: resolveCreatorImageUrl(url),
              })),
            };
          });
        setArtistsData((previous) => {
          const bySlug = new Map(previous.map((artist) => [artist.creatorSlug, artist]));
          tattooCreators.forEach((artist) => bySlug.set(artist.creatorSlug, artist));
          return Array.from(bySlug.values());
        });
      })
      .catch(() => {
        // Keep the bundled fallback artist(s) available while the API is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/studios`)
      .then((response) => {
        if (!response.ok) throw new Error(`Studio request failed: ${response.status}`);
        return response.json();
      })
      .then((studios) => {
        if (!cancelled && Array.isArray(studios) && studios.length > 0) {
          setStudioLocations((prevLocations) => {
            const existingIds = new Set(prevLocations.map((s) => s.id));
            const newStudios = studios.filter((s) => !existingIds.has(s.id));
            return [...prevLocations, ...newStudios];
          });
        }
      })
      .catch(() => {
        // Keep the bundled records available while the API is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(
        document.fullscreenElement === containerRef.current ||
        document.webkitFullscreenElement === containerRef.current
      );
    };
    const exitFallbackFullscreen = (event) => {
      if (event.key === "Escape" && !document.fullscreenElement && !document.webkitFullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);
    document.addEventListener("keydown", exitFallbackFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
      document.removeEventListener("keydown", exitFallbackFullscreen);
    };
  }, []);

  const handleCityChange = (city) => {
    setActiveCity(city);
    setSelectedStudio(null);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleSelectShop = (shop) => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (mapRef.current) {
      mapRef.current.flyTo([shop.lat, shop.lng], 15, { duration: 1.2 });
      setSelectedStudio(shop);
    }
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleFullscreen = () => {
    const mapShell = containerRef.current;
    if (!mapShell) return;

    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
    if (fullscreenElement === mapShell) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    } else if (isFullscreen) {
      setIsFullscreen(false);
    } else if (mapShell.requestFullscreen) {
      setIsFullscreen(true);
      mapShell.requestFullscreen().catch(() => setIsFullscreen(true));
    } else if (mapShell.webkitRequestFullscreen) {
      setIsFullscreen(true);
      mapShell.webkitRequestFullscreen();
    } else {
      setIsFullscreen(true);
    }
  };

  const handleVerifyArtist = () => {
    window.open("https://www.mankindminds.com/apply", "_blank", "noopener,noreferrer");
  };

  const handleSelectArtist = (artist) => {
    const artistSlug = artist.slug || artist.id;
    if (artist.slug) {
      window.location.href = `/creators/${artist.slug}`;
      return;
    }
    setActiveSection("artists");
    setArtistSearchTerm("");
    setIsArtistDropdownOpen(false);
    const node = artistCardRefs.current[artistSlug];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setHighlightedArtistId(artistSlug);
  };

  useEffect(() => {
    if (!highlightedArtistId) return undefined;
    const timer = setTimeout(() => setHighlightedArtistId(null), 2200);
    return () => clearTimeout(timer);
  }, [highlightedArtistId]);

  const scrollToStudios = () => {
    setActiveSection("studios");
    if (pageTopRef.current) {
      pageTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToArtists = () => {
    setActiveSection("artists");
    if (artistsSectionRef.current) {
      artistsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      ref={pageTopRef}
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        backgroundColor: embedded ? "transparent" : "#fbfbfc",
        minHeight: embedded ? "auto" : "100vh",
      }}
    >
      {!embedded && <Header />}

      {/* Sticky in-page nav */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid #e9ecef",
          display: "flex",
          justifyContent: "center",
          padding: "12px 20px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "#f1f5f9",
            padding: "4px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <button
            onClick={scrollToStudios}
            style={{
              padding: "8px 22px",
              fontSize: "14px",
              fontWeight: "600",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeSection === "studios" ? "#0f172a" : "transparent",
              color: activeSection === "studios" ? "#ffffff" : "#64748b",
              transition: "all 0.2s ease",
            }}
          >
            Studios
          </button>
          <button
            onClick={scrollToArtists}
            style={{
              padding: "8px 22px",
              fontSize: "14px",
              fontWeight: "600",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeSection === "artists" ? "#0f172a" : "transparent",
              color: activeSection === "artists" ? "#ffffff" : "#64748b",
              transition: "all 0.2s ease",
            }}
          >
            Artists
          </button>
        </div>
      </div>

      {/* ================= STUDIOS SECTION ================= */}
      <div
        className="map-explorer"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "44px 20px 60px 20px",
        }}
      >
        <p
          style={{
            margin: "0 0 8px 0",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#1B8A5A",
            textTransform: "uppercase",
          }}
        >
          Verified Network
        </p>
        <h2
          style={{
            margin: "0 0 10px 0",
            fontWeight: "700",
            fontSize: "32px",
            letterSpacing: "-0.6px",
            color: "#0f172a",
            textAlign: "center",
          }}
        >
          Find Certified Studios Near You
        </h2>
        <p
          style={{
            margin: "0 0 32px 0",
            fontSize: "15px",
            color: "#64748b",
            textAlign: "center",
            maxWidth: "560px",
            lineHeight: "1.6",
          }}
        >
          Every studio on this map has been vetted for quality, hygiene, and authenticity —
          so you can book with confidence.
        </p>

        {/* Map Container */}
        <div
          ref={containerRef}
          className={`studio-map-shell${isFullscreen ? " map-shell-fullscreen-fallback" : ""}`}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "1000px",
            height: "550px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
            backgroundColor: "#f8f9f9",
            overflow: "hidden",
            marginBottom: "56px",
          }}
        >
          <div className="map-controls">
            <div
              className="map-city-picker"
              style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                zIndex: 1000,
                display: "inline-flex",
                backgroundColor: "#ffffff",
                padding: "4px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "1px solid #cbd5e1",
              }}
            >
              <button
                onClick={() => handleCityChange("All")}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeCity === "All" ? "#0f172a" : "transparent",
                  color: activeCity === "All" ? "#ffffff" : "#475569",
                  transition: "all 0.2s ease",
                }}
              >
                All
              </button>
              <button
                onClick={() => handleCityChange("London")}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeCity === "London" ? "#0f172a" : "transparent",
                  color: activeCity === "London" ? "#ffffff" : "#475569",
                  transition: "all 0.2s ease",
                }}
              >
                London
              </button>
              <button
                onClick={() => handleCityChange("Norwich")}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeCity === "Norwich" ? "#0f172a" : "transparent",
                  color: activeCity === "Norwich" ? "#ffffff" : "#475569",
                  transition: "all 0.2s ease",
                }}
              >
                Norwich
              </button>
            </div>

            {/* Studio search */}
            <div className="map-search" style={{ position: "absolute", top: "14px", right: "14px", zIndex: 1000, width: "280px" }}>
              <input
                type="text"
                placeholder={`Search ${activeCity} studio or ref...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "13px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  boxSizing: "border-box",
                }}
              />

              {isDropdownOpen && searchTerm.trim().length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "6px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                    maxHeight: "240px",
                    overflowY: "auto",
                  }}
                >
                  {filteredShops.length > 0 ? (
                    filteredShops.map((shop) => (
                      <div
                        key={shop.id}
                        onClick={() => handleSelectShop(shop)}
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.15s ease",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                      >
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                          {shop.name}
                        </span>
                        <span style={{ fontSize: "11px", color: "#0284c7", fontWeight: "600" }}>
                          Ref: {shop.refCode}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "12px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
                      No studios found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <MapContainer
            ref={mapRef}
            center={LONDON_CENTER}
            zoom={13}
            minZoom={8}
            style={{ width: "100%", height: "100%" }}
            zoomControl={false}
          >
            <MapResizeHandler />
            <MapController activeCity={activeCity} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_33h6_1_17466d83582460ee6d073f4c"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {activeLocations.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={customIcon}
                ref={(el) => (markerRefs.current[loc.id] = el)}
                eventHandlers={{ click: () => setSelectedStudio(loc) }}
              />
            ))}
          </MapContainer>

          <button
            type="button"
            className="map-fullscreen-button"
            onClick={handleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Open map fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Open map fullscreen"}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {isFullscreen ? (
                <path d="M9 3v3H6M15 3v3h3M9 21v-3H6M15 21v-3h3" />
              ) : (
                <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
              )}
            </svg>
          </button>

          {selectedStudio && (
            <section className="studio-detail-panel" aria-label={`${selectedStudio.name} details`}>
              <button
                type="button"
                className="studio-detail-close"
                onClick={() => setSelectedStudio(null)}
                aria-label="Close studio details"
              >
                Close details <span aria-hidden="true">×</span>
              </button>
              <div className="studio-detail-content" onWheel={(event) => event.stopPropagation()}>
                <div style={{ padding: "0px", backgroundColor: "#ffffff", color: "#0f172a", overflow: "hidden" }}>
                  <div className="studio-detail-image-frame">
                    <img
                      className="studio-detail-image"
                      src={resolveStudioImageUrl(selectedStudio.image)}
                      alt={selectedStudio.name}
                    />
                  </div>

                  <div style={{ padding: "10px 4px 4px 4px" }}>
                    <h3 style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>
                      {selectedStudio.name}
                    </h3>
                    <p style={{ margin: "0 0 2px 0", fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                      {selectedStudio.hubTitle} | {selectedStudio.postcode}
                    </p>
                    {(selectedStudio.address || selectedStudio.phone || selectedStudio.email || selectedStudio.website) && (
                      <p style={{ margin: "0 0 8px 0", fontSize: "11px", lineHeight: "1.45", color: "#475569" }}>
                        {selectedStudio.address && <>{selectedStudio.address}<br /></>}
                        {selectedStudio.phone && <>{selectedStudio.phone}<br /></>}
                        {selectedStudio.email && <>{selectedStudio.email}<br /></>}
                        {selectedStudio.website && <a href={selectedStudio.website} target="_blank" rel="noreferrer">{selectedStudio.website}</a>}
                      </p>
                    )}
                    <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: "#0284c7", fontWeight: "600" }}>
                      Ref Code: {selectedStudio.refCode}
                    </p>

                    <p style={{ margin: "0 0 10px 0", fontSize: "12px", lineHeight: "1.4", color: "#334155" }}>
                      {selectedStudio.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid #e2e8f0",
                        paddingTop: "8px",
                        marginBottom: "10px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      <span style={{ color: "#d97706" }}>
                        Rating: {selectedStudio.starRating} / 5.0
                      </span>
                      <span style={{ color: "#475569", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>
                        AI Status: {selectedStudio.aiPercentage}
                      </span>
                    </div>

                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                      <p style={{ margin: "0 0 8px 0", fontSize: "11px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>
                        VERIFIED ARTISTS
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          maxHeight: "120px",
                          overflowY: "auto",
                          paddingRight: "4px",
                        }}
                      >
                        {(selectedStudio.artists || []).map((artist, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: "100%",
                              backgroundColor: "#ffffff",
                              border: "1px solid #e2e8f0",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#0f172a",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              boxSizing: "border-box",
                            }}
                          >
                            <span>{artist}</span>
                            <button
                              onClick={handleVerifyArtist}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#2563eb",
                                textDecoration: "underline",
                                fontWeight: "600",
                                fontSize: "12px",
                                cursor: "pointer",
                                padding: 0,
                              }}
                            >
                              Verify Yourself
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Studios Cards Grid */}
        <div
          className="studio-grid"
          style={{
            width: "100%",
            maxWidth: "1000px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {activeLocations.map((loc) => (
            <div
              key={loc.id}
              className="studio-card"
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                overflow: "hidden",
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 10px 24px rgba(15, 23, 42, 0.10)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(15, 23, 42, 0.05)";
              }}
            >
              <img
                src={resolveStudioImageUrl(loc.image)}
                alt={loc.name}
                style={{ width: "100%", height: "180px", objectFit: "cover" }}
              />
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>
                  {loc.name}
                </h3>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b" }}>
                  {loc.hubTitle} • {loc.postcode}
                </p>
                <p style={{ fontSize: "13px", color: "#334155", flexGrow: 1, marginBottom: "16px", lineHeight: "1.5" }}>
                  {loc.description}
                </p>

                <button
                  onClick={() => handleSelectShop(loc)}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    backgroundColor: "#1B8A5A",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#146c46")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1B8A5A")}
                >
                  View on map
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section divider */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ height: "1px", backgroundColor: "#e5e7eb" }} />
      </div>

      {/* ================= ARTISTS SECTION ================= */}
      <div
        ref={artistsSectionRef}
        style={{
          padding: "64px 20px 40px 20px",
          maxWidth: "1200px",
          margin: "0 auto",
          scrollMarginTop: "70px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <p
            style={{
              margin: "0 0 8px 0",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "1.5px",
              color: "#1B8A5A",
              textTransform: "uppercase",
            }}
          >
            Meet the Talent
          </p>
          <h2
            style={{
              margin: "0 0 12px 0",
              fontSize: "32px",
              fontWeight: "700",
              letterSpacing: "-0.6px",
              color: "#0f172a",
            }}
          >
            Featured Artists
          </h2>
          <p
            style={{
              margin: "0 auto",
              fontSize: "15px",
              color: "#64748b",
              maxWidth: "560px",
              lineHeight: "1.6",
            }}
          >
            Every artist below has been individually verified for authenticity and craft.
            Explore portfolios and connect directly through Instagram.
          </p>
        </div>

        {/* Artist search */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
            <input
              type="text"
              placeholder="Search artists by name, style, or studio..."
              value={artistSearchTerm}
              onChange={(e) => {
                setArtistSearchTerm(e.target.value);
                setIsArtistDropdownOpen(true);
              }}
              onFocus={() => setIsArtistDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsArtistDropdownOpen(false), 150)}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "13px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                outline: "none",
                backgroundColor: "#ffffff",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
                boxSizing: "border-box",
              }}
            />

            {isArtistDropdownOpen && artistSearchTerm.trim().length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: "6px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                  maxHeight: "260px",
                  overflowY: "auto",
                  zIndex: 30,
                  textAlign: "left",
                }}
              >
                {artistSuggestions.length > 0 ? (
                  artistSuggestions.map((artist) => (
                    <div
                      key={artist.id}
                      onMouseDown={() => handleSelectArtist(artist)}
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.15s ease",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                    >
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                        {artist.name}
                      </span>
                      <span style={{ fontSize: "11px", color: "#0284c7", fontWeight: "600" }}>
                        {artist.styles?.[0]}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "12px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
                    No artists found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {artistsData.map((artist) => (
          <Link
            key={artist.id}
            to={artist.creatorSlug ? `/creators/${artist.creatorSlug}` : "#"}
            ref={(el) => (artistCardRefs.current[artist.id] = el)}
            style={{
              display: "block",
              marginBottom: "40px",
              padding: "28px",
              borderRadius: "20px",
              background: "linear-gradient(180deg, #ffffff 0%, #fbfdfc 100%)",
              boxShadow:
                highlightedArtistId === artist.id
                  ? "0 0 0 3px #1B8A5A, 0 10px 30px rgba(15, 23, 42, 0.08)"
                  : "0 10px 30px rgba(15, 23, 42, 0.07)",
              border: "1px solid #ececec",
              borderTop: "3px solid #1B8A5A",
              scrollMarginTop: "90px",
              transition: "box-shadow 0.3s ease, transform 0.15s ease",
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(15, 23, 42, 0.14)";
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                highlightedArtistId === artist.id
                  ? "0 0 0 3px #1B8A5A, 0 10px 30px rgba(15, 23, 42, 0.08)"
                  : "0 10px 30px rgba(15, 23, 42, 0.07)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "20px",
              }}
            >
              <div style={{ display: "flex", gap: "18px", maxWidth: "640px" }}>
                <img
                  src={artist.imageUrl || artist.portfolio?.[0]?.url}
                  alt={`${artist.name} profile`}
                  style={{
                    width: "76px",
                    height: "76px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "3px solid #ffffff",
                    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.18)",
                  }}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0f172a" }}>
                      {artist.name}
                    </h3>
                    {artist.verified && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#1B8A5A",
                          backgroundColor: "rgba(27,138,90,0.1)",
                          padding: "3px 10px",
                          borderRadius: "20px",
                          letterSpacing: "0.3px",
                        }}
                      >
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  {(artist.studio || artist.location) && (
                    <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                      {[artist.studio, artist.location].filter(Boolean).join(" • ")}
                    </p>
                  )}

                  <p style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#334155", lineHeight: "1.6" }}>
                    {artist.bio}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {(artist.styles || []).map((style) => (
                      <span
                        key={style}
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#475569",
                          backgroundColor: "#f1f5f9",
                          padding: "4px 10px",
                          borderRadius: "20px",
                        }}
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                {artist.rating && (
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#d97706" }}>
                    ★ {artist.rating} rating
                  </span>
                )}
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  View Profile →
                </span>
              </div>
            </div>

            {artist.portfolio?.length > 0 && (
              <div style={{ marginTop: "22px" }}>
                <p
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#94a3b8",
                    letterSpacing: "0.6px",
                    textTransform: "uppercase",
                  }}
                >
                  Recent work
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", maxWidth: "100%", overflow: "hidden" }}>
                  {artist.portfolio.slice(0, 5).map((item, index) => {
                    const remaining = artist.portfolio.length - 5;
                    const isLastVisible = index === 4 && remaining > 0;
                    return (
                      <div
                        key={item.id}
                        style={{
                          position: "relative",
                          width: "clamp(52px, 18vw, 72px)",
                          height: "clamp(52px, 18vw, 72px)",
                          borderRadius: "12px",
                          overflow: "hidden",
                          flexShrink: 0,
                          boxShadow: "0 3px 10px rgba(15, 23, 42, 0.12)",
                        }}
                      >
                        <img
                          src={item.url}
                          alt={`${artist.name} work ${index + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        {isLastVisible && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(15, 23, 42, 0.55)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: "700",
                            }}
                          >
                            +{remaining}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Link>
        ))}

        {/* Artist Sign-Up CTA */}
        <div
          style={{
            marginTop: "56px",
            padding: "48px 40px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.25)",
            textAlign: "center",
            color: "#ffffff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-60px",
              right: "-60px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(27,138,90,0.25) 0%, rgba(27,138,90,0) 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-80px",
              left: "-40px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(74,222,128,0.12) 0%, rgba(74,222,128,0) 70%)",
            }}
          />

          <p
            style={{
              margin: "0 0 10px 0",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "1.5px",
              color: "#4ade80",
              textTransform: "uppercase",
            }}
          >
            For Tattoo Artists
          </p>

          <h2 style={{ margin: "0 0 14px 0", fontSize: "32px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            Get Verified. Get Discovered.
          </h2>

          <p
            style={{
              margin: "0 auto 32px auto",
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#cbd5e1",
              maxWidth: "560px",
            }}
          >
            Join a growing network of verified studios and artists. Showcase your portfolio,
            build trust with a verification badge, and get discovered by clients actively
            searching for certified talent near them.
          </p>

          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "28px", marginBottom: "36px" }}>
            {[
              { icon: "✓", label: "Verified Badge" },
              { icon: "📈", label: "Increased Visibility" },
              { icon: "🖼️", label: "Free Portfolio Page" },
            ].map((benefit) => (
              <div
                key={benefit.label}
                style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#e2e8f0" }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(74, 222, 128, 0.15)",
                    color: "#4ade80",
                    fontSize: "13px",
                  }}
                >
                  {benefit.icon}
                </span>
                {benefit.label}
              </div>
            ))}
          </div>

          <button
            onClick={handleVerifyArtist}
            style={{
              padding: "14px 36px",
              fontSize: "15px",
              fontWeight: "700",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              backgroundColor: "#1B8A5A",
              color: "#ffffff",
              boxShadow: "0 6px 18px rgba(27, 138, 90, 0.35)",
              transition: "background-color 0.2s ease, transform 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#146c46";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1B8A5A";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Apply to Join
          </button>

          <p style={{ marginTop: "16px", fontSize: "12px", color: "#94a3b8" }}>
            Applications reviewed within 48 hours · No fees to apply
          </p>
        </div>
      </div>
    </div>
  );
}