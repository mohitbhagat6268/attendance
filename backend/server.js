const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ================= DATABASE SETUP =================
const DB_PATH = path.join(__dirname, 'db', 'attendance.db');
fs.mkdirSync(path.join(__dirname, 'db'), { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    username TEXT,
    subject TEXT,
    qrCode TEXT,
    date TEXT,
    time TEXT
  )`);

  // NEW TABLE for ESP32 tokens
  db.run(`CREATE TABLE IF NOT EXISTS qr_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT,
    device_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ================= RESET SAMPLE USERS =================
function resetUsersToFriends() {
  const friends = [
    { username: 'Akmal', password: 'TBIT24043', role: 'student' },
    { username: 'Mohit', password: 'TBIT24063', role: 'student' },
    { username: 'Krishna', password: 'TBIT24057', role: 'student' },
    { username: 'Ayush', password: 'TBIT24006', role: 'student' },
    { username: 'Shivam', password: 'TBIT24141', role: 'student' },
    { username: 'Krish', password: 'TBIT24032', role: 'student' },
    { username: 'Vrushali', password: 'TBIT24009', role: 'student' },
    { username: 'Aditi', password: 'TBIT24054', role: 'student' },
    { username: 'Anchal', password: 'TBIT001', role: 'student' },
    { username: 'Ankita', password: 'TBIT24017', role: 'student' },
    { username: 'Nilesh', password: 'Nilesh@123', role: 'teacher' }
  ];

  db.serialize(() => {
    db.run("DELETE FROM users", function (err) {
      if (err) return console.error(err);
      const stmt = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
      for (const u of friends) {
        const hashed = bcrypt.hashSync(u.password, 10);
        stmt.run(u.username, hashed, u.role);
      }
      stmt.finalize();
    });
  });
}

resetUsersToFriends();

// ================= AUTH LOGIC =================
const JWT_SECRET = 'verysecret_demo_key_change_in_prod';

app.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.json({ success: false, message: 'Missing fields' });

  db.get("SELECT * FROM users WHERE username=? AND role=?", [username, role], (err, user)=>{
    if(err) return res.json({ success:false, message:err.message });
    if(!user) return res.json({ success:false, message:'User not found' });

    if(!bcrypt.compareSync(password, user.password)) return res.json({ success:false, message:'Wrong password' });

    const token = jwt.sign({ id:user.id, username:user.username, role:user.role }, JWT_SECRET, { expiresIn:'8h' });
    res.json({ success:true, token, username:user.username, role:user.role });
  });
});

function authMiddleware(req,res,next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ success:false, message:'No token provided' });
  const token = auth.split(' ')[1];
  try{
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  }catch{
    return res.status(401).json({ success:false, message:'Invalid token' });
  }
}

// ================= ATTENDANCE ROUTES =================
app.post('/mark-attendance', authMiddleware, (req,res)=>{
  if(req.user.role!=='student') return res.status(403).json({ success:false, message:'Only students can mark attendance' });
  const { subject, qrCode } = req.body;
  if(!subject) return res.status(400).json({ success:false, message:'Subject required' });

  const student_id = req.user.id;
  const username = req.user.username;
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString('en-IN', { hour12:true });

  db.get("SELECT * FROM attendance WHERE student_id=? AND subject=? AND date=?", [student_id, subject, date], (err,row)=>{
    if(err) return res.status(500).json({ success:false, message:err.message });
    if(row) return res.json({ success:false, message:'Attendance already marked', date, time });

    db.run("INSERT INTO attendance (student_id, username, subject, qrCode, date, time) VALUES (?,?,?,?,?,?)",
      [student_id, username, subject, qrCode, date, time],
      function(err){
        if(err) return res.status(500).json({ success:false, message:err.message });
        res.json({ success:true, message:'Attendance marked', id:this.lastID, date, time });
      }
    );
  });
});

app.get('/my-attendance', authMiddleware, (req,res)=>{
  if(req.user.role!=='student') return res.status(403).json({ success:false, message:'Only students can fetch attendance' });
  const student_id = req.user.id;
  db.all("SELECT student_id, username, subject, date, time, qrCode FROM attendance WHERE student_id=? ORDER BY date ASC",[student_id],(err,rows)=>{
    if(err) return res.json({ success:false, message:err.message });
    const attendance = rows.map(r=>({
      studentId:r.student_id,
      username:r.username,
      subject:r.subject,
      date:r.date,
      time:r.time,
      qrCode:r.qrCode
    }));
    res.json({ success:true, attendance, totalMarked: rows.length });
  });
});

// ================= NEW ENDPOINT FOR ESP32 QR TOKENS =================
app.post('/api/newtoken', (req, res) => {
  const { token, device_id } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'Token missing' });

  db.run("INSERT INTO qr_tokens (token, device_id) VALUES (?, ?)", [token, device_id || 'unknown'], function (err) {
    if (err) return res.status(500).json({ success: false, message: err.message });
    console.log(`📲 Token received from ${device_id}: ${token}`);
    res.json({ success: true, message: 'Token saved', id: this.lastID });
  });
});

// ================= START SERVER =================
const PORT = 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

