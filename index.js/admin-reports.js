const exportReportsBtn = document.getElementById("exportReportsBtn");

if (exportReportsBtn) {
  exportReportsBtn.addEventListener("click", () => {
    showToast("success", "Report exported", "Admin report export started successfully.");
  });
}