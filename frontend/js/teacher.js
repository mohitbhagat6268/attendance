const ttoken = localStorage.getItem('token');
const tuser = localStorage.getItem('username') || '';
if (!ttoken) { window.location.href = 'index.html'; }
document.getElementById('usern').innerText = tuser;
document.getElementById('logout').addEventListener('click', ()=>{ localStorage.clear(); window.location.href='index.html'; });

async function loadAll(){
  const res = await fetch('http://localhost:5002/attendance', {
    headers: { 'Authorization': 'Bearer ' + ttoken }
  });
  const rows = await res.json();
  const tbody = document.querySelector('#attTable tbody');
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.id}</td><td>${r.student_username || r.student_id}</td><td>${r.date}</td>`;
    tbody.appendChild(tr);
  });
}
loadAll();
