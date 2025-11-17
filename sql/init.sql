-- Drop old tables if they exist
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS attendance;

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('student', 'teacher'))
);

-- Attendance table
CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    subject TEXT,
    qrCode TEXT,
    date TEXT
);
