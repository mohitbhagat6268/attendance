document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  if (!loginForm) {
    console.error('Form with id "loginForm" not found.');
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    if (!username || !password || !role) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch('http://localhost:5002/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);

        if (data.role === 'student') {
          window.location.href = 'student.html';
        } else if (data.role === 'teacher') {
          window.location.href = 'teacher.html';
        } else {
          alert('Unknown role. Cannot redirect.');
        }
      } else {
        alert('Login failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('An error occurred while logging in. Please try again.');
    }
  });
});
