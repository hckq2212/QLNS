import cron from "node-cron";
import { sendDebtDueReminders } from "./sendDebtDueReminders.js";

// 08:00 mỗi ngày
cron.schedule("0 10 * * *", async () => {
  try {
    const rs = await sendDebtDueReminders();
    console.log("Debt reminders:", rs);
  } catch (e) {
    console.error("Debt reminders error:", e);
  }
}, { timezone: "Asia/Ho_Chi_Minh" });
