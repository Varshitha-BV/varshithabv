// Get DOM elements
const balanceEl = document.getElementById('balance');
const incomeAmountEl = document.getElementById('income-amount');
const expenseAmountEl = document.getElementById('expense-amount');
const transactionFormEl = document.getElementById('transaction-form');
const descriptionEl = document.getElementById('description');
const amountEl = document.getElementById('amount');
const transactionTypeEl = document.getElementById('transaction-type');
const categoryEl = document.getElementById('category');
const dateEl = document.getElementById('date');
const notesEl = document.getElementById('notes');
const transactionListEl = document.getElementById('transaction-list');

// Set default date to today
dateEl.valueAsDate = new Date();

// Get current user's transactions
let transactions = getUserTransactions();

// Initialize the application
function init() {
    transactionListEl.innerHTML = '';
    transactions.forEach(addTransactionToDOM);
    updateValues();
}

// Add transaction to DOM list
function addTransactionToDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement('li');
    item.classList.add(transaction.amount < 0 ? 'expense' : 'income');

    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString();

    item.innerHTML = `
        <div class="transaction-info">
            <span class="description">${transaction.description}</span>
            <span class="details">${formattedDate} ${transaction.notes ? '• ' + transaction.notes : ''}</span>
        </div>
        <span class="category-tag">${transaction.category}</span>
        <span class="amount ${transaction.amount < 0 ? 'expense' : 'income'}">
            ${sign}₹${Math.abs(transaction.amount).toFixed(2)}
        </span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">×</button>
    `;

    transactionListEl.appendChild(item);
}

// Update balance, income and expense
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);
    
    // Calculate balance
    const total = amounts.reduce((acc, item) => (acc + item), 0).toFixed(2);
    
    // Calculate income
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc + item), 0)
        .toFixed(2);

    // Calculate expenses
    const expense = (amounts
        .filter(item => item < 0)
        .reduce((acc, item) => (acc + item), 0) * -1)
        .toFixed(2);

    // Update DOM
    balanceEl.textContent = `₹${total}`;
    incomeAmountEl.textContent = `₹${income}`;
    expenseAmountEl.textContent = `₹${expense}`;
}

// Remove transaction by ID
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    init();
}

// Update local storage
function updateLocalStorage() {
    saveUserTransactions(transactions);
}

// Add transaction
function addTransaction(e) {
    e.preventDefault();

    const description = descriptionEl.value.trim();
    const amount = parseFloat(amountEl.value);
    const isExpense = transactionTypeEl.value === 'expense';
    const category = categoryEl.value;
    const date = dateEl.value;
    const notes = notesEl.value.trim();

    if (description === '' || isNaN(amount) || category === '') {
        alert('Please fill in all required fields');
        return;
    }

    const transaction = {
        id: generateID(),
        description,
        amount: isExpense ? -Math.abs(amount) : Math.abs(amount),
        category,
        date,
        notes
    };

    transactions.push(transaction);
    addTransactionToDOM(transaction);
    updateValues();
    updateLocalStorage();

    // Reset form
    transactionFormEl.reset();
    dateEl.valueAsDate = new Date();
}

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 1000000000);
}

// Filter and sort functionality
const filterTypeEl = document.getElementById('filter-type');
const filterCategoryEl = document.getElementById('filter-category');
const sortDateEl = document.getElementById('sort-date');
const sortAmountEl = document.getElementById('sort-amount');

let currentSort = {
    field: 'date',
    ascending: false
};

function filterTransactions() {
    const typeFilter = filterTypeEl.value;
    const categoryFilter = filterCategoryEl.value;
    
    let filteredTransactions = [...transactions];

    // Apply type filter
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => 
            typeFilter === 'income' ? t.amount > 0 : t.amount < 0
        );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => 
            t.category === categoryFilter
        );
    }

    // Apply current sort
    sortTransactions(filteredTransactions);
}

function sortTransactions(transactionsToSort = transactions) {
    const { field, ascending } = currentSort;

    transactionsToSort.sort((a, b) => {
        let comparison = 0;
        if (field === 'date') {
            comparison = new Date(a.date) - new Date(b.date);
        } else if (field === 'amount') {
            comparison = Math.abs(a.amount) - Math.abs(b.amount);
        }
        return ascending ? comparison : -comparison;
    });

    // Update UI
    transactionListEl.innerHTML = '';
    transactionsToSort.forEach(addTransactionToDOM);
    
    // Update sort icons
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.textContent = '↓';
        icon.classList.remove('asc');
    });
    
    if (ascending) {
        const activeButton = field === 'date' ? sortDateEl : sortAmountEl;
        activeButton.querySelector('.sort-icon').textContent = '↑';
        activeButton.querySelector('.sort-icon').classList.add('asc');
    }
}

function handleSort(field) {
    if (currentSort.field === field) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.field = field;
        currentSort.ascending = false;
    }
    filterTransactions();
}

// Event listeners
transactionFormEl.addEventListener('submit', addTransaction);
transactionTypeEl.addEventListener('change', updateCategoryOptions);
filterTypeEl.addEventListener('change', filterTransactions);
filterCategoryEl.addEventListener('change', filterTransactions);
sortDateEl.addEventListener('click', () => handleSort('date'));
sortAmountEl.addEventListener('click', () => handleSort('amount'));

// Initialize app
init();
updateCategoryOptions();