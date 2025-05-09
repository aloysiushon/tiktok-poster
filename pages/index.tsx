import { useState } from "react";
import styles from "../styles/Home.module.css";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const generateVideo = async () => {
    try {
      setLoading(true);
      setMessage("");
      const response = await fetch("/api/generate");
      const data = await response.json();
      if (response.ok) {
        setMessage("Video generated successfully! Check your public folder.");
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error generating video:", error);
      setMessage("Error generating video. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Automated Daily Quote Generator</h1>
      <button
        className={styles.generateButton}
        onClick={generateVideo}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Video"}
      </button>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default Home;
