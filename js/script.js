// Get DOM elements
const balanceEl = document.getElementById('balance');
const incomeAmountEl = document.getElementById('income-amount');
const expenseAmountEl = document.getElementById('expense-amount');
const transactionFormEl = document.getElementById('transaction-form');
const amountEl = document.getElementById('amount');
const transactionTypeEl = document.getElementById('transaction-type');
const categoryEl = document.getElementById('category');
const dateEl = document.getElementById('date');
const notesEl = document.getElementById('notes');
const transactionListEl = document.getElementById('transaction-list');

// Initialize transactions array if it doesn't exist
if (!localStorage.getItem('transactions')) {
    localStorage.setItem('transactions', JSON.stringify([]));
}

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
    try {
        const amounts = transactions.map(transaction => parseFloat(transaction.amount));
        
        // Calculate balance
        const total = amounts.reduce((acc, item) => acc + item, 0);
        
        // Calculate income (sum of positive amounts)
        const income = amounts
            .filter(item => item > 0)
            .reduce((acc, item) => acc + item, 0);

        // Calculate expenses (sum of negative amounts)
        const expense = Math.abs(amounts
            .filter(item => item < 0)
            .reduce((acc, item) => acc + item, 0));

        // Update DOM with formatted numbers
        balanceEl.textContent = `₹${total.toFixed(2)}`;
        incomeAmountEl.textContent = `₹${income.toFixed(2)}`;
        expenseAmountEl.textContent = `₹${expense.toFixed(2)}`;
    } catch (error) {
        console.error('Error updating values:', error);
        // Set default values if there's an error
        balanceEl.textContent = '₹0.00';
        incomeAmountEl.textContent = '₹0.00';
        expenseAmountEl.textContent = '₹0.00';
    }
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

    const amount = parseFloat(amountEl.value);
    const isExpense = transactionTypeEl.value === 'expense';
    const category = categoryEl.value;
    const date = dateEl.value;
    const notes = notesEl.value.trim();

    // Validation
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    if (category === '') {
        alert('Please select a category');
        return;
    }

    const transaction = {
        id: generateID(),
        description: category,
        amount: isExpense ? -Math.abs(amount) : Math.abs(amount),
        category,
        date: date || new Date().toISOString().split('T')[0],
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

    if (categoryFilter === 'all') {
        // Show all transactions when "All Categories" is selected, ignore type filter
        filteredTransactions = [...transactions];
    } else if (categoryFilter === 'all-expenses') {
        // Show all expenses, ignore type filter
        filteredTransactions = transactions.filter(t => t.amount < 0);
    } else if (categoryFilter === 'all-income') {
        // Show all income, ignore type filter
        filteredTransactions = transactions.filter(t => t.amount > 0);
    } else {
        // Specific category selected
        filteredTransactions = transactions.filter(t => t.category === categoryFilter);
        // Apply type filter if not 'all'
        if (typeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t =>
                typeFilter === 'income' ? t.amount > 0 : t.amount < 0
            );
        }
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

// Event listeners (guarded when optional elements are absent)
if (transactionFormEl) transactionFormEl.addEventListener('submit', addTransaction);
if (transactionTypeEl) transactionTypeEl.addEventListener('change', updateCategoryOptions);
if (filterTypeEl) filterTypeEl.addEventListener('change', filterTransactions);
if (filterCategoryEl) filterCategoryEl.addEventListener('change', filterTransactions);
if (sortDateEl) sortDateEl.addEventListener('click', () => handleSort('date'));
if (sortAmountEl) sortAmountEl.addEventListener('click', () => handleSort('amount'));

// Clear all transactions button (if present)
const clearBtn = document.getElementById('clear-btn');
if (clearBtn) clearBtn.addEventListener('click', clearAllTransactions);

function clearAllTransactions() {
    if (!confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) return;
    transactions = [];
    updateLocalStorage();
    init();
}

// Function to update category options based on transaction type
function updateCategoryOptions() {
    const transactionType = transactionTypeEl.value;
    const expenseOptions = categoryEl.querySelectorAll('optgroup[label="Expenses"] option');
    const incomeOptions = categoryEl.querySelectorAll('optgroup[label="Income"] option');
    
    expenseOptions.forEach(option => {
        option.style.display = transactionType === 'expense' ? '' : 'none';
    });
    
    incomeOptions.forEach(option => {
        option.style.display = transactionType === 'income' ? '' : 'none';
    });
    
    // Reset category selection
    categoryEl.value = '';
}

// Initialize app
init();
updateCategoryOptions();