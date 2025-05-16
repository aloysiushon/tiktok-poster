import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer-core";
import dotenv from "dotenv";
import path from "path";
import fs from "fs-extra";

dotenv.config();

const COOKIES_FILE_PATH = path.join(process.cwd(), "tiktok_cookies.json");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const email = process.env.TIKTOK_EMAIL;
    const password = process.env.TIKTOK_PASSWORD;

    if (!email || !password) {
      throw new Error("TikTok email or password not set in .env file");
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: false, // Set to false for debugging
      executablePath:
        process.env.CHROME_PATH ||
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      ],
    });

    const page = await browser.newPage();

    try {
      // Set mobile user agent to reduce bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
      );
      //   await page.setViewport({
      //     width: 360,
      //     height: 800,
      //     isMobile: true,
      //     hasTouch: true,
      //   });

      // Load cookies if available
      if (fs.existsSync(COOKIES_FILE_PATH)) {
        const cookies = await fs.readJSON(COOKIES_FILE_PATH);
        await page.setCookie(...cookies);
        console.log("Cookies loaded, skipping login");
      } else {
        console.log("Logging in...");

        // Open TikTok login page
        await page.goto("https://www.tiktok.com/login/phone-or-email/email", {
          waitUntil: "networkidle0",
        });

        // Log in using email and password
        console.log("Logging in...");
        await page.waitForSelector('input[name="username"]', {
          timeout: 15000,
        });
        await page.type('input[name="username"]', email);

        await page.waitForSelector('input[type="password"]');
        await page.type('input[type="password"]', password);

        await page.waitForSelector('button[type="submit"]');
        await page.click('button[type="submit"]');

        await page.waitForNavigation({ waitUntil: "networkidle0" });

        // Verify login was successful
        const loggedIn = await page.evaluate(() =>
          Boolean(document.querySelector('[data-e2e="profile-icon"]'))
        );
        if (!loggedIn) {
          throw new Error(
            "Login failed - check your credentials or solve the CAPTCHA"
          );
        }

        // Save cookies for future sessions
        const cookies = await page.cookies();
        await fs.writeJSON(COOKIES_FILE_PATH, cookies);
        console.log("Login successful, cookies saved");
      }

      await page.evaluateOnNewDocument(() => {
        // Pass the WebDriver check
        Object.defineProperty(navigator, "webdriver", { get: () => false });
      });

      // Go to upload page
      console.log("Navigating to upload page...");
      await page.goto("https://www.tiktok.com/tiktokstudio/upload", {
        waitUntil: "networkidle2",
      });

      // Upload the video
      const videoPath = path.join(process.cwd(), "public", "LaiSeeSee.mp4");
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found at ${videoPath}`);
      }

      // Click the "Select video" button to open the file picker
      const selectVideoButton = await page.waitForSelector(
        '[data-e2e="select_video_button"]',
        { visible: true }
      );

      if (!selectVideoButton) throw new Error("Select video button not found");
      await selectVideoButton.click();
      console.log("Clicked Select video button");

      // Wait for the hidden file input to appear
      const fileInputSelector = 'input[type="file"]';
      await page.waitForSelector(fileInputSelector, { timeout: 10000 });
      const fileInput = await page.$(fileInputSelector);
      if (!fileInput) throw new Error("File input not found");

      // Upload the video file
      // Check if the file exists
      if (!fs.existsSync(videoPath)) {
        throw new Error(`❌ Video file not found at ${videoPath}`);
      }
      console.log("🎥 Video file found");

      // Upload the video file
      console.log("📁 Uploading video file...");
      await fileInput.uploadFile(videoPath);
      console.log("✅ Video file attached, waiting for 10 seconds...");

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Wait for the video preview to appear
      console.log("🔍 Checking for video preview...");
      try {
        await page.waitForSelector('[data-e2e="mobile_preview_container"]', {
          timeout: 30000,
        });
        console.log("✅ Video preview detected - file upload confirmed");
      } catch (err) {
        console.error(
          "❌ Video preview not detected - file might not have uploaded correctly"
        );
        throw err;
      }

      // Add hashtags (hardcoded for now)
      // Add a short delay to ensure the editor is fully loaded
      await new Promise((resolve) => setTimeout(resolve, 2000));

      //   // Find the contenteditable div
      //   const editorSelector = 'div[contenteditable="true"]';
      //   await page.waitForSelector(editorSelector, { timeout: 15000 });
      //   const editor = await page.$(editorSelector);

      //   if (!editor) throw new Error("Caption editor not found");

      //   // Clear the existing text and insert hashtags
      //   const hashtags = "#motivation #quotes #singapore #poly";
      //   await page.evaluate(
      //     (editor, hashtags) => {
      //       const event = new InputEvent("input", { bubbles: true });
      //       editor.textContent = hashtags;
      //       editor.dispatchEvent(event);
      //     },
      //     editor,
      //     hashtags
      //   );

      const editorSelector = 'div[contenteditable="true"]';
      await page.waitForSelector(editorSelector, { timeout: 15000 });

      // Double-click to focus the editor
      await page.click(editorSelector);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await page.click(editorSelector);
      console.log("🖱️ Double-clicked the editor to focus");
      await page.keyboard.type(" - ");

      //   // Clear the existing text
      //   await page.evaluate(() => {
      //     const editor = document.querySelector('div[contenteditable="true"]');
      //     if (editor) {
      //       editor.textContent = "";
      //       const event = new InputEvent("input", { bubbles: true });
      //       editor.dispatchEvent(event);
      //     }
      //   });
      //   console.log("🗑️ Cleared the existing text");

      // Clear the existing text properly
      //   await page.keyboard.down("Control");
      //   await page.keyboard.press("A");
      //   await page.keyboard.up("Control");
      //   await page.keyboard.press("Backspace");

      //   console.log("🗑️ Cleared the existing text");

      // Simulate typing the hashtags
      //   const hashtags = " - #motivation  ";
      //   for (const char of hashtags) {
      //     await page.keyboard.type(char);
      //     await new Promise((resolve) => setTimeout(resolve, 50));
      //     // Small delay to mimic human typing
      //   }

      // Simulate typing the hashtags with selection
      const hashtags = [
        "BuaySaiGiveUp",
        "sgtiktok",
        "tiktoksg",
        "quotes",
        "motivation",
        "life",
        "fyp",
      ];
      for (const tag of hashtags) {
        // Type the '#' first to trigger the dropdown
        await page.keyboard.type("#");
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Type the actual hashtag text
        for (const char of tag) {
          await page.keyboard.type(char);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Wait for the dropdown to appear
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Confirm the hashtag selection with 'Enter'
        await page.keyboard.press("Enter");
        console.log(`✅ Selected hashtag #${tag}`);
        await page.keyboard.type(" ");

        // Add a space to separate the next hashtag
        // await page.keyboard.type(" ");
        // await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Click the editor again to ensure the change is applied
      await page.click(editorSelector);
      console.log("🖱️ Clicked the editor again to finalize");

      // Give the page some time to process the changes
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log("📄 Hashtags entered successfully");

      // Delay to ensure the description is saved
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Click the post button
      console.log("Posting the video...");
      const submitButtonSelector = 'button[data-e2e="post_video_button"]';
      await page.waitForSelector(submitButtonSelector, { timeout: 15000 });
      await page.click(submitButtonSelector);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log("Video submitted successfully!");

      res.status(200).json({ message: "Video posted successfully" });
    } catch (error) {
      console.error("Error posting to TikTok:", error);
      res.status(500).json({ error: "Failed to post to TikTok" });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
