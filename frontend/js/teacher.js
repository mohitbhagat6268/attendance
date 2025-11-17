// ======================= TEACHER.JS =========================

const API = "https://attendance-2-b0qs.onrender.com";

const ttoken = localStorage.getItem("token");
const tuser = localStorage.getItem("username") || "";

if (!ttoken) window.location.href = "index.html";
document.getElementById("usern").innerText = tuser;

document.getElementById("logout").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

// LOAD ALL ATTENDANCE
async function loadAll() {
  try {
    const res = await fetch(`${API}/teacher-all`, {
      headers: { Authorization: "Bearer " + ttoken }
    });

    const result = await res.json();

    if (!result.success) {
      alert(result.message);
      return;
    }

    const tbody = document.querySelector("#attTable tbody");
    tbody.innerHTML = "";

    result.records.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.username}</td>
        <td>${r.subject}</td>
        <td>${r.date} ${r.time}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Teacher fetch error:", err);
  }
}

loadAll();
