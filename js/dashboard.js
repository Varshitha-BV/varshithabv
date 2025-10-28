// Get DOM elements
const monthlyIncomeEl = document.getElementById('monthly-income');
const monthlyExpensesEl = document.getElementById('monthly-expenses');
const monthlySavingsEl = document.getElementById('monthly-savings');
const expenseRateEl = document.getElementById('expense-rate');
const recentTransactionsEl = document.getElementById('recent-transactions');
const budgetAmountEl = document.getElementById('budget-amount');
const setBudgetBtn = document.getElementById('set-budget-btn');
const budgetProgressEl = document.getElementById('budget-progress');
const budgetPercentageEl = document.getElementById('budget-percentage');

// Get transactions from local storage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
// Chart instances (so we can update/destroy when redrawing)
let expenseCategoriesChart = null;
let incomeExpenseChart = null;
let monthlyTrendChart = null;

// Initialize dashboard
function initDashboard() {
    updateMonthlyStats();
    updateRecentTransactions();
    updateCharts();
    updateBudgetProgress();
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

    monthlyIncomeEl.textContent = `$${monthlyIncome.toFixed(2)}`;
    monthlyExpensesEl.textContent = `$${monthlyExpenses.toFixed(2)}`;
    monthlySavingsEl.textContent = `$${savings.toFixed(2)}`;
    expenseRateEl.textContent = `${expenseRate}%`;
}

// Update recent transactions
function updateRecentTransactions() {
    recentTransactionsEl.innerHTML = '';
    const recentTransactions = [...transactions]
        .reverse()
        .slice(0, 5);

    recentTransactions.forEach(transaction => {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        const sign = transaction.amount < 0 ? '-' : '+';
        div.innerHTML = `
            <span>${transaction.description}</span>
            <span class="${transaction.amount < 0 ? 'expense' : 'income'}">
                ${sign}$${Math.abs(transaction.amount).toFixed(2)}
            </span>
        `;
        recentTransactionsEl.appendChild(div);
    });
}

// Update all charts
function updateCharts() {
    updateExpenseCategoriesChart();
    updateIncomeExpenseChart();
    updateMonthlyTrendChart();
}

// Update expense categories chart
function updateExpenseCategoriesChart() {
    // Use category field (if available) for grouping
    const expenses = transactions.filter(t => t.amount < 0);
    const categories = {};

    expenses.forEach(expense => {
        const category = (expense.category || 'uncategorized').toString();
        categories[category] = (categories[category] || 0) + Math.abs(expense.amount);
    });

    const canvas = document.getElementById('expense-categories-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Destroy existing chart instance if present
    if (expenseCategoriesChart) {
        expenseCategoriesChart.destroy();
        expenseCategoriesChart = null;
    }

    const labels = Object.keys(categories);
    const data = Object.values(categories);

    // If there is no data, show a placeholder single grey slice
    const hasData = data.length > 0 && data.reduce((a, b) => a + b, 0) > 0;

    const backgroundColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#F39C12', '#2ECC71', '#A569BD', '#E74C3C'
    ];

    if (!hasData) {
        expenseCategoriesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#ecf0f1']
                }]
            },
            options: {
                plugins: {
                    legend: { display: false }
                }
            }
        });
        return;
    }

    // Map colors to labels (re-use or cycle)
    const colors = labels.map((_, i) => backgroundColors[i % backgroundColors.length]);

    expenseCategoriesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                hoverOffset: 8
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: $${value.toFixed(2)} (${percent}%)`;
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

// Update income vs expenses chart
function updateIncomeExpenseChart() {
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
    if (monthlyBudget > 0) {
        const monthlyExpenses = getMonthlyData().expenses;
        const percentage = (monthlyExpenses / monthlyBudget) * 100;
        budgetProgressEl.style.width = `${Math.min(percentage, 100)}%`;
        budgetProgressEl.style.backgroundColor = percentage > 100 ? '#c0392b' : '#27ae60';
        budgetPercentageEl.textContent = `${percentage.toFixed(1)}%`;
        budgetAmountEl.value = monthlyBudget;
    }
}

// Set monthly budget
function setMonthlyBudget() {
    const amount = parseFloat(budgetAmountEl.value);
    if (amount > 0) {
        monthlyBudget = amount;
        localStorage.setItem('monthlyBudget', amount);
        updateBudgetProgress();
    }
}

// Event listeners
setBudgetBtn.addEventListener('click', setMonthlyBudget);

// Initialize dashboard
initDashboard();