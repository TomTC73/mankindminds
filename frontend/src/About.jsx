import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import content from "./about-content.html?raw";
import { aboutTitle, aboutDescription, aboutUrl } from "./aboutMetadata";
import "./Home.css";
import "./About.css";

function About() {
  useEffect(() => {
    const previousTitle = "Mankind Minds | Verify Your Work as AI-Free";
    const metadata = [
      ['meta[name="description"]', aboutDescription, "Mankind Minds helps artists verify their work as AI-free, discover AI-free creators, and build trust through human authenticity certification."],
      ['meta[property="og:title"]', aboutTitle, previousTitle],
      ['meta[property="og:description"]', aboutDescription, "Verify your work as AI-free, find AI-free artists, and showcase trusted human-made creativity."],
      ['meta[property="og:url"]', aboutUrl, "https://www.mankindminds.com/"],
      ['meta[name="twitter:title"]', aboutTitle, previousTitle],
      ['meta[name="twitter:description"]', aboutDescription, "Verify your work as AI-free and discover AI-free artists on Mankind Minds."],
    ];
    document.title = aboutTitle;
    metadata.forEach(([selector, value]) => document.querySelector(selector)?.setAttribute("content", value));
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = aboutUrl;
    document.head.appendChild(canonical);
    return () => {
      document.title = previousTitle;
      metadata.forEach(([selector, , previous]) => document.querySelector(selector)?.setAttribute("content", previous));
      canonical.remove();
    };
  }, []);

  return (
    <div className="about-page">
      <Header />
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <Footer />
    </div>
  );
}

export default About;
