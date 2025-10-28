// Check if user is logged in
function checkAuth() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
    }
    return currentUser;
}

// Get current user's transactions
function getUserTransactions() {
    const currentUser = checkAuth();
    const userTransactions = localStorage.getItem(`transactions_${currentUser}`);
    return userTransactions ? JSON.parse(userTransactions).transactions : [];
}

// Save transactions for current user
function saveUserTransactions(transactions) {
    const currentUser = checkAuth();
    localStorage.setItem(`transactions_${currentUser}`, JSON.stringify({ transactions }));
}

// Add logout function
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Export user name for display
const currentUser = checkAuth();