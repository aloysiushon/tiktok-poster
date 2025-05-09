import { useEffect, useState } from "react";
import styles from "../styles/Template.module.css";

interface Quote {
  title: string;
  quote: string;
  description: string;
  background: string;
  music: string;
}

const Template = () => {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    // Extract query parameters from the URL
    const params = new URLSearchParams(window.location.search);
    const title = params.get("title") || "";
    const quoteText = params.get("quote") || "";
    const description = params.get("description") || "";
    const background = params.get("background") || "";
    const music = params.get("music") || "";

    setQuote({
      title,
      quote: quoteText,
      description,
      background,
      music,
    });
  }, []);

  // Text animation
  useEffect(() => {
    if (quote) {
      const quoteText = document.getElementById("quoteText");
      if (quoteText) {
        const words = quote.quote.split(" ");
        quoteText.innerHTML = words
          .map(
            (word, index) =>
              `<span class="${styles.animatedText}" style="animation-delay: ${
                index * 0.5
              }s;">${word} </span>`
          )
          .join(" ");
      }
    }
  }, [quote]);

  if (!quote) return null;

  return (
    <div
      className={styles.container}
      style={{
        backgroundImage: `url(/backgrounds/${quote.background})`,
      }}
    >
      <div className={styles.overlay}></div>
      <div className={styles.content}>
        <h2 className={styles.title}>{quote.title}</h2>
        <p id="quoteText" className={styles.text}></p>
        <p className={styles.description}>{quote.description}</p>
        <audio autoPlay loop>
          <source src={`/music/${quote.music}`} type="audio/mpeg" />
        </audio>
      </div>
    </div>
  );
};

export default Template;
