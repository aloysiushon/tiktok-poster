import axios from "axios";
import cron from "node-cron";
import fs from "fs-extra";
import path from "path";

console.log("🔄 Setting up cron jobs...");

// Set timezone for consistency
const TIMEZONE = "Asia/Singapore";

// Status file path
const statusFilePath = path.join(process.cwd(), "status.json");

// Ensure status file exists
async function ensureStatusFile() {
  if (!fs.existsSync(statusFilePath)) {
    const initialStatus = {
      lastGenerated: "Never",
      lastPosted: "Never",
    };
    await fs.writeJSON(statusFilePath, initialStatus);
  }
}

// Helper to update status file
async function updateStatus(
  updates: Partial<{ lastGenerated: string; lastPosted: string }>
) {
  const status = await fs.readJSON(statusFilePath);
  const updatedStatus = { ...status, ...updates };
  await fs.writeJSON(statusFilePath, updatedStatus);
}

// Generate video at 8:30 AM
cron.schedule(
  "30 8 * * *",
  async () => {
    try {
      console.log("🎥 Generating video...");
      await axios.get("http://localhost:3000/api/generate");
      console.log("✅ Video generated successfully");

      // Update status
      const timestamp = new Date().toISOString();
      await updateStatus({ lastGenerated: timestamp });
      console.log("📝 Status updated:", { lastGenerated: timestamp });
    } catch (error) {
      console.error("❌ Error generating video:", error);
    }
  },
  {
    timezone: TIMEZONE,
  }
);

// Post video at 9:00 AM
cron.schedule(
  "0 9 * * *",
  async () => {
    try {
      console.log("🚀 Posting video to TikTok...");
      await axios.get("http://localhost:3000/api/upload");
      console.log("✅ Video posted successfully");

      // Update status
      const timestamp = new Date().toISOString();
      await updateStatus({ lastPosted: timestamp });
      console.log("📝 Status updated:", { lastPosted: timestamp });
    } catch (error) {
      console.error("❌ Error posting video:", error);
    }
  },
  {
    timezone: TIMEZONE,
  }
);

// Run the initial status check
ensureStatusFile()
  .then(() => console.log("✅ Status file initialized"))
  .catch(console.error);
