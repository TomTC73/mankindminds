import { useEffect, useState } from "react";
import { API_URL } from "./apiConfig";
import CreatorBanner from "./CreatorBanner";

const CATEGORY_MATCHES = {
  music: ["music", "musician", "singer", "songwriter", "composer", "producer"],
  writing: ["writing", "writer", "author", "poet", "novelist", "screenwriter", "copywriter"],
  videos: ["video", "content creator", "videographer", "filmmaker", "youtuber"],
  art: ["art", "artist", "illustrator", "photographer", "painter", "sculptor", "designer"],
};

const CATEGORY_LABELS = {
  music: "Music",
  writing: "Writing",
  videos: "Video",
  art: "Art",
};

function HomeFeaturedCreators({ category }) {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const label = CATEGORY_LABELS[category];

  useEffect(() => {
    const controller = new AbortController();
    setCreators([]);
    setLoading(true);
    setError("");

    fetch(`${API_URL}/creators`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Creators request failed (${response.status}).`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("The creators response was invalid.");
        const matches = CATEGORY_MATCHES[category];
        setCreators(data.filter((creator) => {
          const creatorCategory = creator.category?.toLowerCase() || "";
          return !creatorCategory.includes("tattoo")
            && matches.some((match) => creatorCategory.includes(match));
        }));
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        console.error(`Could not load featured ${category} creators:`, requestError);
        setError(import.meta.env.DEV
          ? `Could not load creators from ${API_URL}. Check that the local backend is running, then reload this page.`
          : "Featured creators could not be loaded. Please refresh the page to try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [category]);

  return (
    <section className="home-featured-creators" aria-labelledby="home-featured-creators-title">
      <div className="home-featured-creators-heading">
        <p>Meet the Talent</p>
        <h2 id="home-featured-creators-title">Featured {label} Creators</h2>
        <p>
          Discover verified creators whose {label.toLowerCase()} work has been reviewed by Mankind Minds.
        </p>
      </div>
      {loading && <p className="home-featured-creators-message" role="status">Loading verified creators…</p>}
      {error && <p className="home-featured-creators-message" role="alert">{error}</p>}
      {!loading && !error && creators.length === 0 && (
        <p className="home-featured-creators-message">
          No verified {label.toLowerCase()} creators are currently listed.
        </p>
      )}
      {!loading && !error && creators.length > 0 && (
        <CreatorBanner
          creators={creators}
          ariaLabel={`Featured verified ${label.toLowerCase()} creators`}
        />
      )}
    </section>
  );
}

export default HomeFeaturedCreators;
