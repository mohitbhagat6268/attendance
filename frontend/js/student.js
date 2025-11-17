const token = localStorage.getItem("token") || "demoToken";
const username = localStorage.getItem("username") || "Student1";
document.getElementById("usern").innerText = username;

let html5QrCode = null;
let countdownInterval = null;
let scanning = false;

// Toast function
function showToast(message, type="info", duration=3000){
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast " + type + " show";
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(()=>{ toast.classList.remove("show"); toast.remove(); }, duration);
}

// Sidebar
document.getElementById("nav-scan").addEventListener("click", ()=> {
  document.getElementById("scan-section").style.display="block";
  document.getElementById("my-section").style.display="none";
  startScanner();
});

document.getElementById("nav-my").addEventListener("click", ()=> {
  document.getElementById("scan-section").style.display="none";
  document.getElementById("my-section").style.display="block";
  document.getElementById("stats").innerHTML = `
    <table>
      <thead>
        <tr><th>Student ID</th><th>Name</th><th>Subject</th><th>Date & Time</th><th>Attendance</th></tr>
      </thead>
      <tbody id="attendance-body"></tbody>
    </table>`;
  stopScanner();
  fetchAttendance();
});

document.getElementById("logout").addEventListener("click", ()=> {
  localStorage.clear();
  window.location.href="index.html";
});

// Start QR scanner
function startScanner(){
  const subject = document.getElementById("subjectSelect").value;
  if(!subject){ showToast("⚠️ Please select a subject first","error"); return; }
  if(scanning) return;
  scanning = true;
  if(!html5QrCode) html5QrCode = new Html5Qrcode("reader");

  let timeLeft = 10;
  document.getElementById("timer").innerText = `Time Left: ${timeLeft}s`;

  countdownInterval = setInterval(()=>{
    timeLeft--;
    document.getElementById("timer").innerText = `Time Left: ${timeLeft}s`;
    if(timeLeft <= 0){
      clearInterval(countdownInterval);
      stopScanner();
      showToast("⏳ Scan timed out!","info");
    }
  },1000);

  html5QrCode.start(
    {facingMode:"environment"},
    {fps:10, qrbox:250},
    (decodedText)=>{
      clearInterval(countdownInterval);
      stopScanner();
      document.getElementById("timer").innerText="";
      showToast(`✅ Attendance marked for ${subject}`,"success");

      fetch("http://localhost:5002/mark-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ subject, qrCode: decodedText })
      })
      .then(res=>res.json())
      .then(data=>{
        if(data.success){
          showToast(`✅ Attendance saved at ${data.time}`,"success");
        } else showToast(`⚠️ ${data.message}`,"error");
      })
      .catch(err=>{ console.error(err); showToast("❌ Server error","error"); });

      setTimeout(()=> scanning=false, 1000);
    },
    ()=>{}
  ).catch(err=>{
    clearInterval(countdownInterval);
    scanning = false;
    document.getElementById("timer").innerText="";
    showToast("⚠️ Please allow camera access!","error");
    console.error("Camera error:",err);
  });
}

// Stop scanner
function stopScanner(){
  if(html5QrCode && html5QrCode._isScanning){
    html5QrCode.stop().then(()=> html5QrCode.clear()).catch(err=>console.error("Stop error:",err));
  }
  clearInterval(countdownInterval);
  document.getElementById("timer").innerText="";
  scanning=false;
}

// Fetch attendance
function fetchAttendance(){
  fetch("http://localhost:5002/my-attendance", { headers: { "Authorization": `Bearer ${token}` }})
  .then(res=>res.json())
  .then(data=>{
    const tbody=document.getElementById("attendance-body");
    tbody.innerHTML="";
    data.attendance.forEach(rec=>{
      const row=`<tr>
        <td>${rec.studentId || "TBIT"+Math.floor(10000+Math.random()*90000)}</td>
        <td>${username}</td>
        <td>${rec.subject}</td>
        <td>${rec.date} ${rec.time}</td>
        <td class="attendance-present">Present</td>
      </tr>`;
      tbody.insertAdjacentHTML("beforeend",row);
    });
  })
  .catch(err=>console.error("Error fetching attendance:",err));
}

// Auto start scanner
window.addEventListener("load", startScanner);
