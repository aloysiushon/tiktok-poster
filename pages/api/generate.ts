import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

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

    // Ensure ffmpeg path is set
    if (!ffmpegPath) {
      throw new Error("FFmpeg binary not found");
    }
    ffmpeg.setFfmpegPath(ffmpegPath);

    const localMacPath =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    const herokuPath = "/app/.apt/usr/bin/google-chrome";

    function getChromePath() {
      if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
      if (fs.existsSync(localMacPath)) return localMacPath;
      if (fs.existsSync(herokuPath)) return herokuPath;
      throw new Error("No suitable Chrome executable found");
    }

    const executablePath = getChromePath();

    // Launch Puppeteer to generate quote image
    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
      ],
    });

    // const browser = await puppeteer.launch({
    //   headless: true,
    //   executablePath:
    //     process.env.CHROME_PATH || "/app/.apt/usr/bin/google-chrome",
    //   args: [
    //     "--no-sandbox",
    //     "--disable-setuid-sandbox",
    //     "--disable-dev-shm-usage",
    //     "--disable-gpu",
    //     "--no-zygote",
    //     "--single-process",
    //   ],
    // });

    const page = await browser.newPage();
    const isLocal = process.env.NODE_ENV !== "production";
    const baseUrl = isLocal
      ? "http://localhost:3000"
      : `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;

    // Set the URL to your locally hosted template page
    // const url = `http://localhost:3000/template?title=${encodeURIComponent(
    // const url = `https://tiktok-auto-poster-70413365ce50.herokuapp.com/template?title=${encodeURIComponent(
    const url = `${baseUrl}/template?title=${encodeURIComponent(
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

    // Generate a screenshot
    const screenshotPath = path.join(process.cwd(), "public", "LaiSeeSee.png");
    await page.screenshot({ path: screenshotPath });

    await browser.close();

    // Generate the final video with FFmpeg
    const outputVideoPath = path.join(process.cwd(), "public", "LaiSeeSee.mp4");
    ffmpeg()
      .input(screenshotPath) // Input the screenshot
      .inputOptions(["-loop 1"]) // Loop the image
      .input(path.join(process.cwd(), "public", "music", randomQuote.music)) // Input the random music
      .output(outputVideoPath)
      .videoCodec("libx264") // Use H.264 video codec
      .audioCodec("aac") // Use AAC audio codec
      .outputOptions([
        "-t 12", // Total video duration
        "-pix_fmt yuv420p", // TikTok-friendly pixel format
        "-b:v 5000k", // Video bitrate
        "-b:a 192k", // Audio bitrate
        "-ar 44100", // Audio sample rate
        "-r 30", // Frame rate
        "-crf 23", // Reasonable quality
        "-preset veryfast", // Faster encoding
        "-movflags +faststart", // Ensure proper streaming
      ])
      .on("end", () => {
        console.log("Video generated successfully");
        res
          .status(200)
          .json({ message: "Video generated successfully", outputVideoPath });
      })
      .on("error", (err) => {
        console.error("Error generating video:", err);
        res.status(500).json({ error: "Failed to generate video" });
      })
      .run();
  } catch (error) {
    console.error("Error generating video:", error);
    res.status(500).json({ error: "Failed to generate video" });
  }
}
