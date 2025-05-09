import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Load quotes from JSON
    const quotesFile = path.join(process.cwd(), "public", "quotes.json");
    const quotes = JSON.parse(fs.readFileSync(quotesFile, "utf-8"));

    // Pick a random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    if (!randomQuote.description) randomQuote.description = "";

    // Get a random background
    const bgPath = path.join(process.cwd(), "public", "backgrounds");
    const bgFiles = fs.readdirSync(bgPath);
    const randomBg = bgFiles[Math.floor(Math.random() * bgFiles.length)];
    randomQuote.background = randomBg;

    // Get a random music file
    const musicPath = path.join(process.cwd(), "public", "music");
    const musicFiles = fs.readdirSync(musicPath);
    const randomMusic =
      musicFiles[Math.floor(Math.random() * musicFiles.length)];
    randomQuote.music = randomMusic;

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set the URL to your locally hosted template page
    const url = `http://localhost:3000/template?title=${encodeURIComponent(
      randomQuote.title
    )}&quote=${encodeURIComponent(
      randomQuote.quote
    )}&description=${encodeURIComponent(
      randomQuote.description
    )}&background=${encodeURIComponent(
      randomQuote.background
    )}&music=${encodeURIComponent(randomQuote.music)}`;
    console.log("Generated URL:", url);

    // Set the viewport for the video aspect ratio
    await page.setViewport({ width: 1080, height: 1920 });
    await page.goto(url, { waitUntil: "networkidle0" });

    // Generate the video (screenshot for now, will upgrade to video later)
    const outputPath = path.join(process.cwd(), "public", "output.png");
    await page.screenshot({ path: outputPath });

    await browser.close();

    console.log("Video generated successfully");
    res
      .status(200)
      .json({ message: "Video generated successfully", outputPath });
  } catch (error) {
    console.error("Error generating video:", error);
    res.status(500).json({ error: "Failed to generate video" });
  }
}
