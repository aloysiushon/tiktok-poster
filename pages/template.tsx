// import { useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Template.module.css";

const Template = () => {
  const router = useRouter();
  const { title, quote, description, background, music } = router.query;

  const uppercasedQuote = quote ? (quote as string).toUpperCase() : "";

  // useEffect(() => {
  //   const quoteText = document.getElementById("quoteText");
  //   if (quoteText && typeof quote === "string") {
  //     const words = quote.split(" ");
  //     quoteText.innerHTML = words
  //       .map(
  //         (word, index) =>
  //           `<span class="${styles.animatedText}" style="animation-delay: ${
  //             (index / words.length) * 8
  //           }s;">${word} </span>`
  //       )
  //       .join(" ");
  //   }
  // }, [quote]);

  return (
    <div
      className={styles.container}
      style={{
        backgroundImage: `url(/backgrounds/${background})`,
      }}
    >
      <div className={styles.overlay}></div>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p id="quoteText" className={styles.text}>
          {uppercasedQuote}
        </p>
        <p className={styles.description}>{description}</p>
        <audio autoPlay loop>
          <source src={`/music/${music}`} type="audio/mpeg" />
        </audio>
      </div>
    </div>
  );
};

export default Template;
