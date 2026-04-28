let isLogin = true;

function switchAuth(mode) {
    isLogin = mode === 'login';
    document.getElementById('loginTab').classList.toggle('active', isLogin);
    document.getElementById('signupTab').classList.toggle('active', !isLogin);
    document.getElementById('signupFields').style.display = isLogin ? 'none' : 'block';
    document.getElementById('submitBtn').textContent = isLogin ? 'Sign In' : 'Create Account';
}

function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const name = document.getElementById('nameInput').value;

    if (!isLogin && !name) {
        alert("Please enter your name.");
        return;
    }

    // Mock Backend Auth via LocalStorage
    let users = JSON.parse(localStorage.getItem('medUsers') || '{}');
    
    if (isLogin) {
        if (!users[email] || users[email].password !== password) {
            alert("Invalid email or password!");
            return;
        }
        localStorage.setItem('currentUser', JSON.stringify(users[email]));
    } else {
        if (users[email]) {
            alert("Email already registered!");
            return;
        }
        const newUser = { id: 'MD-' + Math.floor(Math.random()*10000), name, email, password };
        users[email] = newUser;
        localStorage.setItem('medUsers', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        // Initialize empty history for new user specific
        localStorage.setItem(`history_${email}`, '[]');
    }

    window.location.href = 'patient-dashboard.html';
}

// Global Auth Check
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        // Update UI with user info
        document.querySelectorAll('.user-name-display').forEach(el => el.textContent = user.name);
        document.querySelectorAll('.user-id-display').forEach(el => el.textContent = user.id);
        
        // Change login link to logout
        const authLinks = document.querySelectorAll('.auth-link');
        authLinks.forEach(link => {
            link.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Logout';
            link.href = '#';
            link.onclick = (e) => {
                e.preventDefault();
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            };
        });
    } else {
        // Restrict access to secure pages
        const securePages = ['patient-dashboard.html'];
        const currentPath = window.location.pathname.split('/').pop();
        if (securePages.includes(currentPath)) {
            window.location.href = 'auth.html';
        }
    }
});
