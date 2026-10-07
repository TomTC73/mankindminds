import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resolveCreatorImageUrl } from "./apiConfig";
import "./CreatorBanner.css";

function CreatorBanner({ creators, ariaLabel }) {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", updateViewportWidth);

    return () => {
      window.removeEventListener("resize", updateViewportWidth);
    };
  }, []);

  if (!creators?.length) {
    return null;
  }

  const isMobile = viewportWidth <= 640;

  const tileWidth = isMobile
    ? Math.min(190, Math.max(150, viewportWidth * 0.42))
    : Math.min(250, Math.max(160, viewportWidth * 0.2));

  const tileGap = 16;

  /*
   * Each half of the marquee needs to be comfortably wider than
   * the viewport. This prevents empty space appearing between loops,
   * especially on mobile when only a few creators are available.
   */
  const minimumLoopWidth = viewportWidth * 2;

  const creatorSetWidth =
    creators.length * (tileWidth + tileGap);

  const copiesPerLoop = Math.max(
    1,
    Math.ceil(minimumLoopWidth / creatorSetWidth),
  );

  const loopCreators = Array.from(
    { length: copiesPerLoop },
    () => creators,
  ).flat();

  /*
   * Base animation duration on distance rather than creator count.
   * Mobile deliberately scrolls more slowly.
   */
  const loopWidth =
    loopCreators.length * (tileWidth + tileGap);

  const pixelsPerSecond = isMobile ? 20 : 32;

  const animationDuration = Math.max(
    isMobile ? 40 : 28,
    loopWidth / pixelsPerSecond,
  );

  return (
    <div
      className="creator-banner"
      role="region"
      aria-label={ariaLabel}
    >
      <div
        className="creator-banner-track"
        style={{
          "--creator-tile-width": `${tileWidth}px`,
          "--creator-tile-gap": `${tileGap}px`,
          animationDuration: `${animationDuration}s`,
        }}
      >
        {[...loopCreators, ...loopCreators].map((creator, index) => {
          const isDuplicate = index >= loopCreators.length;

          const slug =
            creator.creatorSlug ||
            creator.slug;

          const imageUrl = resolveCreatorImageUrl(
            creator.imageUrl ||
              creator.gallery?.[0] ||
              creator.portfolio?.[0]?.url,
          );

          const location = [
            creator.studio,
            creator.location,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <Link
              key={`${creator.id || slug}-${index}`}
              to={`/creators/${encodeURIComponent(slug)}`}
              className="creator-banner-tile"
              aria-hidden={isDuplicate ? "true" : undefined}
              tabIndex={isDuplicate ? -1 : undefined}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="creator-banner-initials"
                  aria-hidden="true"
                >
                  {creator.name
                    ?.trim()
                    ?.charAt(0)
                    ?.toUpperCase() || "✦"}
                </span>
              )}

              <span className="creator-banner-overlay">
                <span className="creator-banner-verified">
                  ✓ Verified
                </span>

                <span className="creator-banner-name">
                  {creator.name}
                </span>

                {location && (
                  <span className="creator-banner-location">
                    {location}
                  </span>
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