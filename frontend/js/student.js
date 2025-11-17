// ======================= STUDENT.JS =========================

const API = "https://attendance-2-b0qs.onrender.com";

const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token) window.location.href = "index.html";
document.getElementById("usern").innerText = username;

let html5QrCode = null;
let countdownInterval = null;
let scanning = false;

// Toast
function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type} show`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// Navigation
document.getElementById("nav-scan").addEventListener("click", () => {
  document.getElementById("scan-section").style.display = "block";
  document.getElementById("my-section").style.display = "none";
  startScanner();
});

document.getElementById("nav-my").addEventListener("click", () => {
  document.getElementById("scan-section").style.display = "none";
  document.getElementById("my-section").style.display = "block";
  stopScanner();
  fetchAttendance();
});

document.getElementById("logout").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

// Start QR Scanner
function startScanner() {
  const subject = document.getElementById("subjectSelect").value;
  if (!subject) return showToast("⚠️ Select a subject first", "error");

  if (scanning) return;
  scanning = true;

  if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

  let timeLeft = 10;
  document.getElementById("timer").innerText = `Time Left: ${timeLeft}s`;

  countdownInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = `Time Left: ${timeLeft}s`;

    if (timeLeft <= 0) {
      stopScanner();
      showToast("⏳ Scan timed out");
    }
  }, 1000);

  html5QrCode
    .start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        stopScanner();
        showToast(`🎉 Attendance Scanned`, "success");

        fetch(`${API}/mark-attendance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            subject,
            qrCode: decodedText
          })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success)
              showToast(`✅ Attendance saved at ${data.time}`, "success");
            else showToast(`⚠️ ${data.message}`, "error");
          })
          .catch(() => showToast("❌ Server error", "error"));
      }
    )
    .catch(() => showToast("⚠️ Camera permission denied", "error"));
}

// Stop Scanner
function stopScanner() {
  if (html5QrCode && html5QrCode._isScanning) {
    html5QrCode.stop().then(() => html5QrCode.clear());
  }
  clearInterval(countdownInterval);
  scanning = false;
  document.getElementById("timer").innerText = "";
}

// Fetch My Attendance
function fetchAttendance() {
  fetch(`${API}/my-attendance`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById("attendance-body");
      tbody.innerHTML = "";

      data.attendance.forEach((rec) => {
        const row = `
          <tr>
            <td>${rec.studentId}</td>
            <td>${username}</td>
            <td>${rec.subject}</td>
            <td>${rec.date} ${rec.time}</td>
            <td class="attendance-present">Present</td>
          </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", row);
      });
    })
    .catch((err) => console.error("Attendance fetch error:", err));
}

// Auto start scanner
window.addEventListener("load", startScanner);
