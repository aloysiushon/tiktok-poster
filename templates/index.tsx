import styles from "@/styles/Template.module.css";
import { useEffect } from "react";

interface Quote {
  title: string;
  quote: string;
  background: string;
}

const Template = ({ quote }: { quote: Quote }) => {
  useEffect(() => {
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
  }, [quote]);
  return (
    <>
      <div className={styles.container}>
        <div className={styles.overlay}></div>
        <div id="quoteText" className={styles.text}></div>
      </div>
    </>
  );
};

export default Template;
