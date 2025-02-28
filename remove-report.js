const fs = require("fs");
const path = "./dist/report.html"; // Path to the generated report.html

fs.unlink(path, (err) => {
  if (err) {
    if (err.code === "ENOENT") {
      console.log("report.html not found, skipping deletion.");
    } else {
      console.error("Error deleting report.html:", err);
    }
  } else {
    console.log("✅ report.html removed successfully.");
  }
});
