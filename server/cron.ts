import axios from "axios";
import cron from "node-cron";
import fs from "fs-extra";
import path from "path";

console.log("🔄 Setting up cron jobs...");

// Status file path
const statusFilePath = path.join(process.cwd(), "status.json");

// Generate video at 8:30 AM
// cron.schedule("30 8 * * *", async () => {
cron.schedule("25 23 * * *", async () => {
  try {
    console.log("🎥 Generating video...");
    await axios.get("http://localhost:3000/api/generate");
    console.log("✅ Video generated successfully");

    // Update status
    const statusData = {
      lastGenerated: new Date().toLocaleString(),
      lastPosted: fs.existsSync(statusFilePath)
        ? (await fs.readJSON(statusFilePath)).lastPosted
        : "Never",
    };
    await fs.writeJSON(statusFilePath, statusData);
  } catch (error) {
    console.error("❌ Error generating video:", error);
  }
});

// Post video at 9:00 AM
// cron.schedule("0 9 * * *", async () => {
cron.schedule("30 23 * * *", async () => {
  try {
    console.log("🚀 Posting video to TikTok...");
    await axios.get("http://localhost:3000/api/upload");
    console.log("✅ Video posted successfully");

    // Update status
    const statusData = {
      lastGenerated: fs.existsSync(statusFilePath)
        ? (await fs.readJSON(statusFilePath)).lastGenerated
        : "Never",
      lastPosted: new Date().toLocaleString(),
    };
    await fs.writeJSON(statusFilePath, statusData);
  } catch (error) {
    console.error("❌ Error posting video:", error);
  }
});
