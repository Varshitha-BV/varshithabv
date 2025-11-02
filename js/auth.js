// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginBox = document.getElementById('loginBox');
const signupBox = document.getElementById('signupBox');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');

// Toggle between login and signup forms
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginBox.classList.add('hidden');
    signupBox.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
});

// Handle Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[username] && users[username].password === password) {
        // Store session
        sessionStorage.setItem('currentUser', username);
        // Redirect to main page
        window.location.href = 'index.html';
    } else {
        alert('Invalid username or password');
    }
});

// Handle Signup
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value.trim();
    const displayName = document.getElementById('displayName') ? document.getElementById('displayName').value.trim() : '';
    const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || {};

    if (users[username]) {
        alert('Username already exists');
        return;
    }

    // Create new user with optional profile fields
    users[username] = {
        password: password,
        createdAt: new Date().toISOString(),
        displayName: displayName || username,
        email: email || ''
    };

    // Save to localStorage
    localStorage.setItem('users', JSON.stringify(users));

    // Auto login
    sessionStorage.setItem('currentUser', username);

    // Create user-specific storage
    const userTransactions = {
        transactions: []
    };
    localStorage.setItem(`transactions_${username}`, JSON.stringify(userTransactions));

    // Redirect to main page
    window.location.href = 'index.html';
});