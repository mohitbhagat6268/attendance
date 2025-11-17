// ======================= LOGIN.JS =========================

const API = "https://attendance-2-b0qs.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) {
    console.error('Form with id "loginForm" not found.');
    return;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    if (!username || !password || !role) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
      });

      const data = await res.json();
      console.log(data);

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role);

        if (data.role === "student") {
          window.location.href = "student.html";
        } else if (data.role === "teacher") {
          window.location.href = "teacher.html";
        }
      } else {
        alert("Login failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Server connection failed");
    }
  });
});
