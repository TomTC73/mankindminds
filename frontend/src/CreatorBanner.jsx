import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resolveCreatorImageUrl } from "./apiConfig";
import "./CreatorBanner.css";

function CreatorBanner({ creators, ariaLabel }) {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const tileWidth = viewportWidth <= 640
    ? Math.min(190, Math.max(150, viewportWidth * 0.42))
    : Math.min(250, Math.max(160, viewportWidth * 0.2));
  const copiesPerLoop = Math.max(
    1,
    Math.ceil(viewportWidth / (creators.length * (tileWidth + 16))),
  );
  const loopCreators = Array.from({ length: copiesPerLoop }, () => creators).flat();

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  return (
    <div className="creator-banner" role="region" aria-label={ariaLabel}>
      <div
        className="creator-banner-track"
        style={{ animationDuration: `${Math.max(24, loopCreators.length * 5)}s` }}
      >
        {[...loopCreators, ...loopCreators].map((creator, index) => {
          const isDuplicate = index >= loopCreators.length;
          const slug = creator.creatorSlug || creator.slug;
          const imageUrl = resolveCreatorImageUrl(
            creator.imageUrl || creator.gallery?.[0] || creator.portfolio?.[0]?.url,
          );
          const location = [creator.studio, creator.location].filter(Boolean).join(" · ");

          return (
            <Link
              key={`${creator.id || slug}-${index}`}
              to={`/creators/${encodeURIComponent(slug)}`}
              className="creator-banner-tile"
              aria-hidden={isDuplicate ? "true" : undefined}
              tabIndex={isDuplicate ? -1 : undefined}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="" aria-hidden="true" />
              ) : (
                <span className="creator-banner-initials" aria-hidden="true">
                  {creator.name?.trim()?.charAt(0)?.toUpperCase() || "✦"}
                </span>
              )}
              <span className="creator-banner-overlay">
                <span className="creator-banner-verified">✓ Verified</span>
                <span className="creator-banner-name">{creator.name}</span>
                {location && (
                  <span className="creator-banner-location">{location}</span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default CreatorBanner;
