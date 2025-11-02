// Get DOM elements
const monthlyIncomeEl = document.getElementById('monthly-income');
const monthlyExpensesEl = document.getElementById('monthly-expenses');
const monthlySavingsEl = document.getElementById('monthly-savings');
const expenseRateEl = document.getElementById('expense-rate');

const budgetAmountEl = document.getElementById('budget-amount');
const setBudgetBtn = document.getElementById('set-budget-btn');
const budgetProgressEl = document.getElementById('budget-progress');
const budgetPercentageEl = document.getElementById('budget-percentage');
const budgetTotalEl = document.getElementById('budget-total');
const budgetUsedEl = document.getElementById('budget-used');
const budgetRemainingEl = document.getElementById('budget-remaining');
const editBudgetBtn = document.getElementById('edit-budget-btn');
const resetBudgetBtn = document.getElementById('reset-budget-btn');
const budgetSparklineCanvas = document.getElementById('budget-sparkline');
let budgetSparklineChart = null;

// Get transactions for current user via check-auth utilities
// (check-auth.js defines getUserTransactions and currentUser)
let transactions = [];

function refreshTransactions() {
    try {
        transactions = getUserTransactions() || [];
    } catch (err) {
        // If check-auth isn't loaded or user not logged in, fall back to global key
        transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    }
}
let monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
// Store per-user monthly budget key
function getMonthlyBudgetKey() {
    const user = sessionStorage.getItem('currentUser');
    return user ? `monthlyBudget_${user}` : 'monthlyBudget';
}

function loadMonthlyBudget() {
    const key = getMonthlyBudgetKey();
    monthlyBudget = parseFloat(localStorage.getItem(key)) || 0;
}

function saveMonthlyBudget(value) {
    const key = getMonthlyBudgetKey();
    monthlyBudget = value;
    localStorage.setItem(key, value);
}
// Chart instances (so we can update/destroy when redrawing)
let incomeExpenseChart = null;
let monthlyTrendChart = null;
let totalsChart = null;

// Initialize dashboard
function initDashboard() {
    refreshTransactions();
    updateMonthlyStats();
    updateCharts();
    loadMonthlyBudget();
    updateBudgetProgress();
    attachBudgetHandlers();
}

// Play notification sound
function playNotificationSound(type = 'warning') {
    if (window.audioUtils) {
        const sounds = window.audioUtils.generateNotificationSounds();
        if (type === 'warning') {
            sounds.playWarning();
        } else if (type === 'danger') {
            sounds.playDanger();
        }
    }
}

// Show notification
function showNotification(message, type = 'warning') {
    const notificationEl = document.getElementById('notification');
    if (!notificationEl) return;
    
    notificationEl.textContent = message;
    notificationEl.className = `notification ${type}`;
    notificationEl.style.display = 'block';
    
    // Play the notification sound
    playNotificationSound(type);
    
    // Add show class after a small delay to trigger animation
    setTimeout(() => notificationEl.classList.add('show'), 10);
    
    // Hide notification after 5 seconds
    setTimeout(() => {
        notificationEl.classList.remove('show');
        setTimeout(() => {
            notificationEl.style.display = 'none';
        }, 300);
    }, 5000);
}

// Check expense warnings
function checkExpenseWarnings(monthlyIncome, monthlyExpenses, totalBalance) {
    if (monthlyExpenses > monthlyIncome) {
        showNotification('Warning: Monthly expenses exceed monthly income!', 'danger');
    } else if (monthlyExpenses > monthlyIncome * 0.9) {
        showNotification('Warning: Monthly expenses are above 90% of monthly income!', 'warning');
    }
    
    if (totalBalance < 0) {
        showNotification('Warning: Total balance is negative!', 'danger');
    } else if (totalBalance < monthlyExpenses * 0.5) {
        showNotification('Warning: Balance is less than 50% of monthly expenses!', 'warning');
    }
}

// Update monthly statistics
function updateMonthlyStats() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date || new Date());
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
        .filter(t => t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
        .filter(t => t.amount < 0)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const savings = monthlyIncome - monthlyExpenses;
    const expenseRate = monthlyIncome ? ((monthlyExpenses / monthlyIncome) * 100).toFixed(1) : 0;

    // Calculate total balance
    const totalBalance = transactions
        .reduce((acc, t) => acc + t.amount, 0);

    monthlyIncomeEl.textContent = `₹${monthlyIncome.toFixed(2)}`;
    monthlyExpensesEl.textContent = `₹${monthlyExpenses.toFixed(2)}`;
    monthlySavingsEl.textContent = `₹${savings.toFixed(2)}`;
    expenseRateEl.textContent = `${expenseRate}%`;

    // Check for warnings
    checkExpenseWarnings(monthlyIncome, monthlyExpenses, totalBalance);
}



// Update all charts
function updateCharts() {
    refreshTransactions();
    updateIncomeExpenseChart();
    updateMonthlyTrendChart();
    updateTotalsChart();
}

// Update totals doughnut chart (Total Balance, Total Income, Total Expense)
function updateTotalsChart() {
    refreshTransactions();
    const totalIncome = transactions
        .filter(t => t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.amount < 0)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const totalBalance = totalIncome - totalExpense;

    const canvas = document.getElementById('totals-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (totalsChart) {
        totalsChart.destroy();
        totalsChart = null;
    }

    const labels = ['Total Balance', 'Total Income', 'Total Expense'];
    // For chart visualization, use absolute values where appropriate
    const dataValues = [Math.abs(totalBalance), totalIncome, totalExpense];
    const backgroundColors = ['#3498db', '#27ae60', '#c0392b'];

    totalsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
                hoverOffset: 8
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ₹${value.toFixed(2)}`;
                        }
                    }
                }
            },
            maintainAspectRatio: false,
            responsive: true,
            cutout: '50%'
        }
    });
}

// Expense categories chart removed — replaced by Budget Overview above

// Update income vs expenses chart
function updateIncomeExpenseChart() {
    refreshTransactions();
    const monthlyData = getMonthlyData();
    const ctx = document.getElementById('income-expense-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Current Month'],
            datasets: [
                {
                    label: 'Income',
                    data: [monthlyData.income],
                    backgroundColor: '#27ae60'
                },
                {
                    label: 'Expenses',
                    data: [monthlyData.expenses],
                    backgroundColor: '#c0392b'
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update monthly trend chart
function updateMonthlyTrendChart() {
    refreshTransactions();
    const last6Months = getLast6MonthsData();
    const ctx = document.getElementById('monthly-trend-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: last6Months.labels,
            datasets: [
                {
                    label: 'Income',
                    data: last6Months.incomes,
                    borderColor: '#27ae60',
                    fill: false
                },
                {
                    label: 'Expenses',
                    data: last6Months.expenses,
                    borderColor: '#c0392b',
                    fill: false
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Render small sparkline of last 6 months expenses in the budget card
function renderBudgetSparkline() {
    refreshTransactions();
    const last6 = getLast6MonthsData();
    const ctx = budgetSparklineCanvas.getContext('2d');
    if (budgetSparklineChart) {
        budgetSparklineChart.destroy();
        budgetSparklineChart = null;
    }

    budgetSparklineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last6.labels,
            datasets: [{
                label: 'Expenses',
                data: last6.expenses,
                borderColor: '#c0392b',
                backgroundColor: 'rgba(192,57,43,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } },
            maintainAspectRatio: false,
            responsive: true
        }
    });
}

// Get monthly data
function getMonthlyData() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date || new Date());
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });

    return {
        income: monthlyTransactions
            .filter(t => t.amount > 0)
            .reduce((acc, t) => acc + t.amount, 0),
        expenses: monthlyTransactions
            .filter(t => t.amount < 0)
            .reduce((acc, t) => acc + Math.abs(t.amount), 0)
    };
}

// Get last 6 months data
function getLast6MonthsData() {
    const months = [];
    const incomes = [];
    const expenses = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        months.push(monthName);

        const monthlyTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date || new Date());
            return transactionDate.getMonth() === date.getMonth() && 
                   transactionDate.getFullYear() === date.getFullYear();
        });

        const monthlyIncome = monthlyTransactions
            .filter(t => t.amount > 0)
            .reduce((acc, t) => acc + t.amount, 0);

        const monthlyExpenses = monthlyTransactions
            .filter(t => t.amount < 0)
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);

        incomes.push(monthlyIncome);
        expenses.push(monthlyExpenses);
    }

    return { labels: months, incomes, expenses };
}

// Update budget progress
function updateBudgetProgress() {
    const monthlyExpenses = getMonthlyData().expenses;
    const total = monthlyBudget || 0;
    const used = monthlyExpenses || 0;
    const remaining = Math.max(total - used, 0);
    const percentage = total > 0 ? (used / total) * 100 : 0;

    budgetProgressEl.style.width = `${Math.min(percentage, 100)}%`;
    budgetProgressEl.style.backgroundColor = percentage > 100 ? '#c0392b' : '#27ae60';
    budgetPercentageEl.textContent = `${percentage > 0 ? percentage.toFixed(1) : 0}%`;
    budgetAmountEl.value = total > 0 ? total : '';

    // Update numeric displays if present
    if (budgetTotalEl) budgetTotalEl.textContent = total.toFixed(2);
    if (budgetUsedEl) budgetUsedEl.textContent = used.toFixed(2);
    if (budgetRemainingEl) budgetRemainingEl.textContent = remaining.toFixed(2);
}

// Set monthly budget
function setMonthlyBudget() {
    const amount = parseFloat(budgetAmountEl.value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid budget amount');
        return;
    }
    saveMonthlyBudget(amount);
    updateBudgetProgress();
    // disable editing after save
    budgetAmountEl.disabled = true;
}

// Event listeners
setBudgetBtn.addEventListener('click', setMonthlyBudget);

function attachBudgetHandlers() {
    if (editBudgetBtn) {
        editBudgetBtn.addEventListener('click', () => {
            budgetAmountEl.disabled = false;
            budgetAmountEl.focus();
        });
    }

    if (resetBudgetBtn) {
        resetBudgetBtn.addEventListener('click', () => {
            if (!confirm('Reset budget for this user?')) return;
            saveMonthlyBudget(0);
            budgetAmountEl.value = '';
            budgetAmountEl.disabled = true;
            updateBudgetProgress();
        });
    }

    // quick preset buttons removed

    // Create sparkline chart for last 6 months expenses
    if (budgetSparklineCanvas) {
        renderBudgetSparkline();
    }
}

// Initialize dashboard
// Listen for storage changes (sync across tabs/pages)
window.addEventListener('storage', (e) => {
    const currentUser = sessionStorage.getItem('currentUser');
    const expectedKey = currentUser ? `transactions_${currentUser}` : 'transactions';
    if (e.key === expectedKey) {
        // Transactions changed elsewhere — refresh UI
        refreshTransactions();
        updateMonthlyStats();
        updateCharts();
        updateBudgetProgress();
    }
    // Also listen for budget changes for this user
    const budgetKey = getMonthlyBudgetKey();
    if (e.key === budgetKey) {
        loadMonthlyBudget();
        updateBudgetProgress();
    }
});

initDashboard();