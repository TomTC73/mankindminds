import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Header from "./Header";

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
    image: "/Tatooshops/image.png",
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
    image: "/Tatooshops/image copy 7.png",
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
    image: "/Tatooshops/image copy 2.png",
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
    image: "/Tatooshops/image copy 3.png",
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
    image: "/Tatooshops/image copy 4.png",
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
    image: "/Tatooshops/image copy 8.png",
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
    image: "/Tatooshops/image copy 6.png",
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
    image: "/Tatooshops/image.png",
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
    image: "/Tatooshops/image copy.png",
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
    image: "/Tatooshops/image copy 2.png",
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
    image: "/Tatooshops/inkme.png",
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
    name: "Sixtyink – London Tattoo Studio",
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
    image: "/Tatooshops/westonetatoo.png",
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
    image: "/Tatooshops/WildflowerTatoo.png",
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

export default function MapPage({ embedded = false }) {
  const customIcon = createCustomPinIcon();
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerRefs = useRef({});
  const [activeCity, setActiveCity] = useState("London");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const activeLocations = activeCity === "London" ? LONDON_LOCATIONS : NORWICH_LOCATIONS;
  const filteredShops = activeLocations.filter((shop) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return false;
    return (
      shop.name.toLowerCase().includes(query) ||
      shop.refCode.toLowerCase().includes(query)
    );
  });

  const handleCityChange = (city) => {
    setActiveCity(city);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleSelectShop = (shop) => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (mapRef.current) {
      mapRef.current.flyTo([shop.lat, shop.lng], 15, { duration: 1.2 });
      const marker = markerRefs.current[shop.id];
      if (marker) {
        marker.openPopup();
      }
    }
    setSearchTerm("");
    setIsDropdownOpen(false);
  };
    const handleVerifyArtist = (artistName, shopName) => {
      window.open("https://www.mankindminds.com/apply", "_blank", "noopener,noreferrer");
    };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", backgroundColor: embedded ? "transparent" : "#ffffff", minHeight: embedded ? "auto" : "100vh" }}>
      {!embedded && <Header />}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "50px 20px",
        }}
      >
        <h2
          style={{
            margin: "0 0 24px 0",
            fontWeight: "600",
            fontSize: "28px",
            letterSpacing: "-0.5px",
            color: "#0f172a",
          }}
        >
          Find Certified Studios Near You
        </h2>

        {/* Map Container */}
        <div
          ref={containerRef}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "1000px",
            height: "550px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            backgroundColor: "#f8f9f9",
            overflow: "hidden",
            marginBottom: "50px",
          }}
        >
          <div
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

          {/* Top-Right Search Bar */}
          <div style={{ position: "absolute", top: "14px", right: "14px", zIndex: 1000, width: "280px" }}>
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

          <MapContainer
            ref={mapRef}
            center={LONDON_CENTER}
            zoom={13}
            minZoom={8}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
          >
            <MapController activeCity={activeCity} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Markers for active city */}
            {activeLocations.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={customIcon}
                ref={(el) => (markerRefs.current[loc.id] = el)}
              >
                <Popup minWidth={270} maxWidth={300}>
                  <div style={{ padding: "0px", backgroundColor: "#ffffff", color: "#0f172a", overflow: "hidden" }}>
                    
                    <div style={{ width: "100%", height: "130px", overflow: "hidden", position: "relative" }}>
                      <img
                        src={loc.image}
                        alt={loc.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>

                    <div style={{ padding: "10px 4px 4px 4px" }}>
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
                          Rating: {loc.starRating} / 5.0
                        </span>
                        <span style={{ color: "#475569", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>
                          AI Status: {loc.aiPercentage}
                        </span>
                      </div>

                      {/* Verified Artists Section with Verify Link */}
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
                          {loc.artists.map((artist, idx) => (
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
                                onClick={() => handleVerifyArtist(artist, loc.name)}
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
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Studios Cards Grid */}
        <div
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
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                overflow: "hidden",
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <img
                src={loc.image}
                alt={loc.name}
                style={{ width: "100%", height: "180px", objectFit: "cover" }}
              />
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a" }}>{loc.name}</h3>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b" }}>
                  {loc.hubTitle} • {loc.postcode}
                </p>
                <p style={{ fontSize: "13px", color: "#334155", flexGrow: 1, marginBottom: "16px" }}>
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
                    borderRadius: "6px",
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
    </div>
  );
}
