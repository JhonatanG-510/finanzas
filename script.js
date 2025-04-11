// Finanzas Personales Dashboard Script
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    const transactionModal = new bootstrap.Modal(document.getElementById('transaction-modal'));
    const categoryModal = new bootstrap.Modal(document.getElementById('category-modal'));
    
    // Default categories if none exist
    const defaultCategories = {
        income: [
            'Salario',
            'Inversiones',
            'Regalos',
            'Bonificaciones',
            'Ventas',
            'Otros Ingresos'
        ],
        expense: [
            'Alimentación',
            'Vivienda',
            'Transporte',
            'Servicios',
            'Entretenimiento',
            'Salud',
            'Educación',
            'Ropa',
            'Otros Gastos'
        ]
    };

    // Initialize state
    let state = {
        transactions: [],
        categories: {
            income: [],
            expense: []
        },
        currentPeriod: {
            startDate: null,
            endDate: null
        },
        editingTransactionId: null,
        piggyBank: {
            balance: 0,
            history: []
        }
    };

    // Charts configuration
    let performanceChart = null;
    let categoriesChart = null;
    let incomeChart = null;
    let expenseChart = null;

    // DOM Elements
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const periodSelector = document.getElementById('period-selector');
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const addFirstTransactionBtn = document.getElementById('add-first-transaction');
    const saveTransactionBtn = document.getElementById('save-transaction');
    const transactionForm = document.getElementById('transaction-form');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const transactionCategorySelect = document.getElementById('transaction-category');
    const transactionsTable = document.getElementById('transactions-table');
    const noTransactionsMsg = document.getElementById('no-transactions');
    const categoryForm = document.getElementById('category-form');
    const incomeValue = document.querySelector('.income-value');
    const expensesValue = document.querySelector('.expenses-value');
    const balanceValue = document.querySelector('.balance-value');
    const savingsValue = document.querySelector('.savings-value');
    const savingsPercent = document.querySelector('.savings-percent');
    const performanceValue = document.querySelector('.performance-value');
    const metricValue = document.querySelector('.metric-value');
    const currentDateRange = document.getElementById('current-date-range');
    
    // Piggy Bank Elements
    const showPiggyBankBtn = document.getElementById('show-piggy-bank');
    const piggyBankValue = document.querySelector('.piggy-bank-value');
    const piggyBankHidden = document.querySelector('.piggy-bank-hidden');
    const piggyBankRevealed = document.querySelector('.piggy-bank-revealed');
    const piggyBankProgress = document.getElementById('piggy-bank-progress');
    const addToPiggyBankBtn = document.getElementById('add-to-piggy-bank');
    const withdrawFromPiggyBankBtn = document.getElementById('withdraw-from-piggy-bank');
    const savePiggyBankBtn = document.getElementById('save-piggy-bank');

    // Navigation and section handling
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Section content containers
    const dashboardSection = document.getElementById('dashboard-section');
    const transactionsSection = document.getElementById('transactions-section');
    const incomeSection = document.getElementById('income-section');
    const expensesSection = document.getElementById('expenses-section');
    const categoriesSection = document.getElementById('categories-section');
    const reportsSection = document.getElementById('reports-section');
    const settingsSection = document.getElementById('settings-section');
    
    // Hide all sections except the dashboard initially
    function hideAllSections() {
        const sections = [
            dashboardSection, 
            transactionsSection, 
            incomeSection, 
            expensesSection, 
            categoriesSection, 
            reportsSection, 
            settingsSection
        ];
        
        sections.forEach(section => {
            if (section) section.style.display = 'none';
        });
    }
    
    // Show a specific section
    function showSection(sectionId) {
        hideAllSections();
        const section = document.getElementById(sectionId);
        if (section) section.style.display = 'block';
    }
    
    // Navigation event listeners
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show the corresponding section
            const linkId = this.id;
            if (linkId === 'dashboard-link') {
                showSection('dashboard-section');
            } else if (linkId === 'transactions-link') {
                showSection('transactions-section');
                // Refresh transactions table
                updateTransactionsTable();
            } else if (linkId === 'income-link') {
                showSection('income-section');
                updateIncomeSection();
            } else if (linkId === 'expenses-link') {
                showSection('expenses-section');
                updateExpensesSection();
            } else if (linkId === 'categories-link') {
                showSection('categories-section');
                updateCategoryLists();
            } else if (linkId === 'reports-link') {
                showSection('reports-section');
            } else if (linkId === 'settings-link') {
                showSection('settings-section');
            }
        });
    });

    // Initialize date filters with datepicker
    function initializeDateFilters() {
        const today = new Date();
        const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Initialize jQuery UI datepicker
        $('.datepicker').datepicker({
            dateFormat: 'dd/mm/yy',
            changeMonth: true,
            changeYear: true,
            dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
            dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
            monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            onSelect: function() {
                updateDateFilter();
            }
        });
        
        // Set initial values
        $('#start-date').datepicker('setDate', firstDayMonth);
        $('#end-date').datepicker('setDate', lastDayMonth);
        
        state.currentPeriod.startDate = firstDayMonth;
        state.currentPeriod.endDate = lastDayMonth;
        
        // Period selector change
        periodSelector.addEventListener('change', function() {
            const selectedPeriod = this.value;
            const now = new Date();
            
            switch(selectedPeriod) {
                case 'current-month':
                    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const lastDayCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    $('#start-date').datepicker('setDate', firstDayCurrentMonth);
                    $('#end-date').datepicker('setDate', lastDayCurrentMonth);
                    break;
                case 'last-month':
                    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                    $('#start-date').datepicker('setDate', firstDayLastMonth);
                    $('#end-date').datepicker('setDate', lastDayLastMonth);
                    break;
                case 'current-year':
                    const firstDayYear = new Date(now.getFullYear(), 0, 1);
                    const lastDayYear = new Date(now.getFullYear(), 11, 31);
                    $('#start-date').datepicker('setDate', firstDayYear);
                    $('#end-date').datepicker('setDate', lastDayYear);
                    break;
                case 'custom':
                    // Just use the current selected dates
                    break;
            }
            
            updateDateFilter();
        });
    }

    // Parse a date from the datepicker format
    function parseInputDate(dateStr) {
        if (!dateStr) return new Date();
        
        // Parse date in format DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-based in JS Date
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
        return new Date();
    }
    
    // Format date for input fields (HTML date inputs and datepicker)
    function formatDateForInput(date) {
        // For jQuery datepicker fields
        if ($('.datepicker').length) {
            // Format as DD/MM/YYYY for datepicker
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } else {
            // For HTML date inputs (YYYY-MM-DD)
            return date.toISOString().split('T')[0];
        }
    }

    // Update date filter and refresh data
    function updateDateFilter() {
        // Get dates from the datepickers
        state.currentPeriod.startDate = parseInputDate($(startDateInput).val());
        state.currentPeriod.endDate = parseInputDate($(endDateInput).val());
        
        // Update period selector if dates match a predefined period
        updatePeriodSelector();
        
        // Update dashboard with new date range
        updateDashboard();
    }

    // Update period selector based on current dates
    function updatePeriodSelector() {
        const start = state.currentPeriod.startDate;
        const end = state.currentPeriod.endDate;
        const now = new Date();
        
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const firstDayYear = new Date(now.getFullYear(), 0, 1);
        const lastDayYear = new Date(now.getFullYear(), 11, 31);
        
        if (start.getTime() === firstDayCurrentMonth.getTime() && end.getTime() === lastDayCurrentMonth.getTime()) {
            periodSelector.value = 'current-month';
        } else if (start.getTime() === firstDayLastMonth.getTime() && end.getTime() === lastDayLastMonth.getTime()) {
            periodSelector.value = 'last-month';
        } else if (start.getTime() === firstDayYear.getTime() && end.getTime() === lastDayYear.getTime()) {
            periodSelector.value = 'current-year';
        } else {
            periodSelector.value = 'custom';
        }
    }

    // Add Transaction Modal
    function setupTransactionModal() {
        // Initialize datepicker for transaction date
        $("#transaction-date").datepicker({
            dateFormat: 'dd/mm/yy',
            changeMonth: true,
            changeYear: true,
            dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
            dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
            monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        });
        
        // Function to open add transaction modal
        function openAddTransactionModal() {
            state.editingTransactionId = null;
            document.getElementById('transaction-modal-title').textContent = 'Agregar Transacción';
            document.getElementById('transaction-id').value = '';
            $("#transaction-date").datepicker('setDate', new Date());
            document.getElementById('transaction-type').value = 'income';
            document.getElementById('transaction-description').value = '';
            document.getElementById('transaction-amount').value = '';
            updateCategoryDropdown('income');
            transactionModal.show();
        }
        
        // Main add transaction button
        addTransactionBtn.addEventListener('click', openAddTransactionModal);
        
        // Also trigger from "add first transaction" button
        if (addFirstTransactionBtn) {
            addFirstTransactionBtn.addEventListener('click', openAddTransactionModal);
        }
        
        // Also trigger from transactions section button
        const addTransactionBtn2 = document.getElementById('add-transaction-btn-2');
        if (addTransactionBtn2) {
            addTransactionBtn2.addEventListener('click', openAddTransactionModal);
        }
        
        // Update categories when type changes
        transactionTypeSelect.addEventListener('change', function() {
            updateCategoryDropdown(this.value);
        });
        
        // Save transaction
        saveTransactionBtn.addEventListener('click', saveTransaction);
    }

    // Update category dropdown based on transaction type
    function updateCategoryDropdown(type) {
        const categories = state.categories[type] || [];
        
        // Clear existing options
        transactionCategorySelect.innerHTML = '';
        
        // Add categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            transactionCategorySelect.appendChild(option);
        });
        
        // Add "Add new category" option
        const newOption = document.createElement('option');
        newOption.value = 'new';
        newOption.textContent = '+ Agregar nueva categoría';
        transactionCategorySelect.appendChild(newOption);
        
        // Event listener for "Add new category"
        transactionCategorySelect.addEventListener('change', function() {
            if (this.value === 'new') {
                // Show category modal
                categoryModal.show();
                // Reset this dropdown
                this.value = categories.length > 0 ? categories[0] : '';
            }
        });
    }

    // Save transaction
    function saveTransaction() {
        const form = document.getElementById('transaction-form');
        
        // Basic form validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const transactionId = document.getElementById('transaction-id').value;
        const dateStr = document.getElementById('transaction-date').value;
        const date = parseInputDate(dateStr);
        const type = document.getElementById('transaction-type').value;
        const category = document.getElementById('transaction-category').value;
        const description = document.getElementById('transaction-description').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        
        if (isNaN(amount) || amount <= 0) {
            alert('Por favor, ingrese un monto válido mayor a cero.');
            return;
        }
        
        const transaction = {
            id: transactionId || Date.now().toString(),
            date: date,
            type: type,
            category: category,
            description: description,
            amount: amount
        };
        
        // If editing, replace transaction
        if (state.editingTransactionId) {
            state.transactions = state.transactions.map(t => 
                t.id === state.editingTransactionId ? transaction : t
            );
        } else {
            // Otherwise add new transaction
            state.transactions.push(transaction);
        }
        
        // Save to local storage
        saveData();
        
        // Update UI
        updateDashboard();
        
        // Close modal
        transactionModal.hide();
    }

    // Setup category management
    function setupCategoryManagement() {
        // Populate category lists
        updateCategoryLists();
        
        // Form submission
        categoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const type = document.getElementById('category-type').value;
            const name = document.getElementById('category-name').value.trim();
            
            if (!name) {
                alert('Por favor, ingrese un nombre de categoría.');
                return;
            }
            
            // Check if category already exists
            if (state.categories[type].includes(name)) {
                alert('Esta categoría ya existe.');
                return;
            }
            
            // Add new category
            state.categories[type].push(name);
            
            // Save to local storage
            saveData();
            
            // Update UI
            updateCategoryLists();
            updateCategoryDropdown(transactionTypeSelect.value);
            
            // Reset form
            document.getElementById('category-name').value = '';
        });
    }

    // Update category lists in the modal
    function updateCategoryLists() {
        const incomeList = document.getElementById('income-categories-list');
        const expenseList = document.getElementById('expense-categories-list');
        
        // Clear lists
        incomeList.innerHTML = '';
        expenseList.innerHTML = '';
        
        // Populate income categories
        state.categories.income.forEach(category => {
            const item = createCategoryListItem(category, 'income');
            incomeList.appendChild(item);
        });
        
        // Populate expense categories
        state.categories.expense.forEach(category => {
            const item = createCategoryListItem(category, 'expense');
            expenseList.appendChild(item);
        });
    }

    // Create category list item with delete button
    function createCategoryListItem(category, type) {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        // Create a span for the category name to allow for proper styling
        const categoryName = document.createElement('span');
        categoryName.textContent = category;
        item.appendChild(categoryName);
        
        // Create delete button - allowing deletion of all categories
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.title = 'Eliminar categoría';
        deleteBtn.addEventListener('click', function() {
            deleteCategory(category, type);
        });
        item.appendChild(deleteBtn);
        
        return item;
    }

    // Delete category
    function deleteCategory(category, type) {
        // Check if the category is being used
        const inUse = state.transactions.some(t => t.type === type && t.category === category);
        
        if (inUse) {
            if (confirm('Esta categoría está siendo utilizada en transacciones existentes. ¿Deseas cambiar todas estas transacciones a otra categoría?')) {
                // Ask for a replacement category
                const newCategory = prompt('Ingresa el nombre de la categoría de reemplazo:');
                if (!newCategory || newCategory.trim() === '') {
                    return; // User cancelled
                }
                
                // Add the new category if it doesn't exist
                if (!state.categories[type].includes(newCategory)) {
                    state.categories[type].push(newCategory);
                }
                
                // Update all transactions with this category
                state.transactions.forEach(t => {
                    if (t.type === type && t.category === category) {
                        t.category = newCategory;
                    }
                });
                
                // Remove the old category
                state.categories[type] = state.categories[type].filter(c => c !== category);
                
                // Save and update UI
                saveData();
                updateCategoryLists();
                updateCategoryDropdown(transactionTypeSelect.value);
                updateDashboard();
            }
            return;
        }
        
        // Confirm deletion
        if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
            // Remove category
            state.categories[type] = state.categories[type].filter(c => c !== category);
            
            // Save to local storage
            saveData();
            
            // Update UI
            updateCategoryLists();
            updateCategoryDropdown(transactionTypeSelect.value);
        }
    }

    // Initialize charts
    function initializeCharts() {
        // Performance chart (main chart)
        const perfCtx = document.getElementById('performance-chart').getContext('2d');
        performanceChart = new Chart(perfCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Ingresos',
                        backgroundColor: 'rgba(15, 140, 60, 0.6)',
                        borderColor: 'rgba(15, 140, 60, 1)',
                        borderWidth: 1,
                        data: []
                    },
                    {
                        label: 'Gastos',
                        backgroundColor: 'rgba(194, 30, 61, 0.6)',
                        borderColor: 'rgba(194, 30, 61, 1)',
                        borderWidth: 1,
                        data: []
                    },
                    {
                        label: 'Balance',
                        type: 'line',
                        fill: false,
                        backgroundColor: 'rgba(13, 110, 253, 0.6)',
                        borderColor: 'rgba(13, 110, 253, 1)',
                        tension: 0.4,
                        data: []
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: false,
                        title: {
                            display: true,
                            text: 'Fecha'
                        }
                    },
                    y: {
                        stacked: false,
                        title: {
                            display: true,
                            text: 'Monto ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString('es-ES');
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + 
                                    context.raw.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                            }
                        }
                    }
                }
            }
        });
        
        // Categories chart (pie/doughnut)
        const catCtx = document.getElementById('categories-chart').getContext('2d');
        categoriesChart = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)',
                        'rgba(83, 102, 255, 0.7)',
                        'rgba(40, 159, 64, 0.7)',
                        'rgba(210, 199, 199, 0.7)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)',
                        'rgba(83, 102, 255, 1)',
                        'rgba(40, 159, 64, 1)',
                        'rgba(210, 199, 199, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const dataset = context.dataset;
                                const total = dataset.data.reduce((acc, data) => acc + data, 0);
                                const percentage = ((value * 100) / total).toFixed(2) + '%';
                                return label + ': $' + value.toLocaleString('es-ES', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + ' (' + percentage + ')';
                            }
                        }
                    }
                }
            }
        });
        
        // Small income chart
        const incomeCtx = document.getElementById('income-chart').getContext('2d');
        incomeChart = new Chart(incomeCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Ingresos',
                    data: [],
                    backgroundColor: 'rgba(15, 140, 60, 0.2)',
                    borderColor: 'rgba(15, 140, 60, 1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                },
                elements: {
                    line: {
                        tension: 0.4
                    }
                }
            }
        });
        
        // Small expense chart
        const expenseCtx = document.getElementById('expense-chart').getContext('2d');
        expenseChart = new Chart(expenseCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Gastos',
                    data: [],
                    backgroundColor: 'rgba(194, 30, 61, 0.2)',
                    borderColor: 'rgba(194, 30, 61, 1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                },
                elements: {
                    line: {
                        tension: 0.4
                    }
                }
            }
        });
    }

    // Update charts with current data
    function updateCharts() {
        if (!state.transactions.length) {
            return;
        }
        
        // Get transactions in the current period
        const filteredTransactions = getFilteredTransactions();
        
        // Prepare data for the performance chart (daily/monthly data)
        updatePerformanceChart(filteredTransactions);
        
        // Prepare data for the categories chart
        updateCategoriesChart(filteredTransactions);
        
        // Update small trend charts
        updateTrendCharts();
    }

    // Update the main performance chart
    function updatePerformanceChart(transactions) {
        const startDate = state.currentPeriod.startDate;
        const endDate = state.currentPeriod.endDate;
        
        // Determine if we should group by day or month based on date range
        const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const groupByMonth = diffDays > 60; // Use months for ranges over 60 days
        
        let dateLabels = [];
        let incomeData = [];
        let expenseData = [];
        let balanceData = [];
        
        if (groupByMonth) {
            // Group by month
            const monthData = {};
            
            // Initialize all months in the range
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const yearMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
                if (!monthData[yearMonth]) {
                    monthData[yearMonth] = {
                        income: 0,
                        expense: 0
                    };
                }
                // Move to next month
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            
            // Aggregate transactions by month
            transactions.forEach(transaction => {
                const date = new Date(transaction.date);
                const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                
                if (transaction.type === 'income') {
                    monthData[yearMonth].income += transaction.amount;
                } else {
                    monthData[yearMonth].expense += transaction.amount;
                }
            });
            
            // Convert to arrays for the chart
            Object.keys(monthData).sort().forEach(yearMonth => {
                const [year, month] = yearMonth.split('-');
                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                dateLabels.push(`${monthNames[parseInt(month) - 1]} ${year}`);
                
                incomeData.push(monthData[yearMonth].income);
                expenseData.push(monthData[yearMonth].expense);
                balanceData.push(monthData[yearMonth].income - monthData[yearMonth].expense);
            });
        } else {
            // Group by day
            const dayData = {};
            
            // Initialize all days in the range
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dateStr = formatDateForInput(currentDate);
                if (!dayData[dateStr]) {
                    dayData[dateStr] = {
                        income: 0,
                        expense: 0
                    };
                }
                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Aggregate transactions by day
            transactions.forEach(transaction => {
                const dateStr = formatDateForInput(new Date(transaction.date));
                
                if (transaction.type === 'income') {
                    dayData[dateStr].income += transaction.amount;
                } else {
                    dayData[dateStr].expense += transaction.amount;
                }
            });
            
            // Convert to arrays for the chart
            Object.keys(dayData).sort().forEach(dateStr => {
                const date = new Date(dateStr);
                dateLabels.push(date.getDate() + '/' + (date.getMonth() + 1));
                
                incomeData.push(dayData[dateStr].income);
                expenseData.push(dayData[dateStr].expense);
                balanceData.push(dayData[dateStr].income - dayData[dateStr].expense);
            });
        }
        
        // Update chart data
        performanceChart.data.labels = dateLabels;
        performanceChart.data.datasets[0].data = incomeData;
        performanceChart.data.datasets[1].data = expenseData;
        performanceChart.data.datasets[2].data = balanceData;
        performanceChart.update();
    }

    // Update the categories chart
    function updateCategoriesChart(transactions) {
        // Get all expense categories with amounts
        const categoryData = {};
        
        transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                if (!categoryData[transaction.category]) {
                    categoryData[transaction.category] = 0;
                }
                categoryData[transaction.category] += transaction.amount;
            }
        });
        
        // Convert to arrays for the chart
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        
        // Update chart
        categoriesChart.data.labels = labels;
        categoriesChart.data.datasets[0].data = data;
        categoriesChart.update();
    }

    // Update small trend charts
    function updateTrendCharts() {
        // Get transactions for the past 6 months for trends
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        
        const transactions = state.transactions.filter(t => 
            new Date(t.date) >= sixMonthsAgo && new Date(t.date) <= today
        );
        
        // Group by month
        const monthlyData = {};
        
        // Initialize all months
        for (let i = 0; i <= 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!monthlyData[yearMonth]) {
                monthlyData[yearMonth] = {
                    income: 0,
                    expense: 0
                };
            }
        }
        
        // Ensure we have at least some data for visualization, even if no transactions
        if (transactions.length === 0) {
            // Generate some minimal random values for visual feedback
            for (let key in monthlyData) {
                monthlyData[key].income = Math.max(1, Math.random() * 10); // Small random income
                monthlyData[key].expense = Math.max(1, Math.random() * 10); // Small random expense
            }
        } else {
            // Aggregate real data
            transactions.forEach(transaction => {
                const date = new Date(transaction.date);
                const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                
                if (monthlyData[yearMonth]) {
                    if (transaction.type === 'income') {
                        monthlyData[yearMonth].income += transaction.amount;
                    } else {
                        monthlyData[yearMonth].expense += transaction.amount;
                    }
                }
            });
        }
        
        // Sort and prepare data
        const labels = Object.keys(monthlyData).sort();
        const incomeData = labels.map(ym => monthlyData[ym].income);
        const expenseData = labels.map(ym => monthlyData[ym].expense);
        
        // Update income chart
        incomeChart.data.labels = labels;
        incomeChart.data.datasets[0].data = incomeData;
        incomeChart.update();
        
        // Update expense chart
        expenseChart.data.labels = labels;
        expenseChart.data.datasets[0].data = expenseData;
        expenseChart.update();
    }

    // Update transactions table
    function updateTransactionsTable() {
        const transactions = getFilteredTransactions();
        
        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Clear table
        transactionsTable.innerHTML = '';
        
        // Show/hide empty state
        if (transactions.length === 0) {
            noTransactionsMsg.style.display = 'block';
        } else {
            noTransactionsMsg.style.display = 'none';
            
            // Add transactions to table
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(transaction.date);
                const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                
                // Create table cells
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${transaction.description}</td>
                    <td>
                        <span class="category-badge ${transaction.type === 'income' ? 'category-income' : 'category-expense'}">
                            ${transaction.category}
                        </span>
                    </td>
                    <td class="transaction-${transaction.type}">
                        ${formatCurrency(transaction.amount)}
                    </td>
                    <td>
                        <button class="action-btn edit" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                // Add event listeners for edit and delete
                row.querySelector('.edit').addEventListener('click', function() {
                    editTransaction(transaction.id);
                });
                
                row.querySelector('.delete').addEventListener('click', function() {
                    deleteTransaction(transaction.id);
                });
                
                transactionsTable.appendChild(row);
            });
        }
        
        // Update the All Transactions tab too
        const allTransactionsTable = document.getElementById('all-transactions-table');
        if (allTransactionsTable) {
            // Get all transactions (without date filtering)
            const allTransactions = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Clear table
            allTransactionsTable.innerHTML = '';
            
            // Add transactions to table
            if (allTransactions.length === 0) {
                allTransactionsTable.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">No hay transacciones para mostrar</td>
                    </tr>
                `;
            } else {
                allTransactions.forEach(transaction => {
                    const row = document.createElement('tr');
                    
                    // Format date
                    const date = new Date(transaction.date);
                    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                    
                    // Create table cells
                    row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>
                            <span class="badge ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}">
                                ${transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                            </span>
                        </td>
                        <td>
                            <span class="category-badge ${transaction.type === 'income' ? 'category-income' : 'category-expense'}">
                                ${transaction.category}
                            </span>
                        </td>
                        <td>${transaction.description}</td>
                        <td class="transaction-${transaction.type}">
                            ${formatCurrency(transaction.amount)}
                        </td>
                        <td>
                            <button class="action-btn edit" data-id="${transaction.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" data-id="${transaction.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    // Add event listeners for edit and delete
                    row.querySelector('.edit').addEventListener('click', function() {
                        editTransaction(transaction.id);
                    });
                    
                    row.querySelector('.delete').addEventListener('click', function() {
                        deleteTransaction(transaction.id);
                    });
                    
                    allTransactionsTable.appendChild(row);
                });
            }
        }
    }

    // Edit transaction
    function editTransaction(id) {
        const transaction = state.transactions.find(t => t.id === id);
        
        if (!transaction) {
            return;
        }
        
        // Set editing id
        state.editingTransactionId = id;
        
        // Populate form
        document.getElementById('transaction-modal-title').textContent = 'Editar Transacción';
        document.getElementById('transaction-id').value = transaction.id;
        $("#transaction-date").datepicker('setDate', new Date(transaction.date));
        document.getElementById('transaction-type').value = transaction.type;
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-amount').value = transaction.amount;
        
        // Update category dropdown
        updateCategoryDropdown(transaction.type);
        
        // Set category
        setTimeout(() => {
            document.getElementById('transaction-category').value = transaction.category;
        }, 100);
        
        // Show modal
        transactionModal.show();
    }

    // Delete transaction
    function deleteTransaction(id) {
        if (confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
            state.transactions = state.transactions.filter(t => t.id !== id);
            
            // Save to local storage
            saveData();
            
            // Update UI
            updateDashboard();
        }
    }

    // Get transactions filtered by current date range
    function getFilteredTransactions() {
        return state.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= state.currentPeriod.startDate && 
                   transactionDate <= state.currentPeriod.endDate;
        });
    }

    // Update summary metrics
    function updateSummaryMetrics() {
        const transactions = getFilteredTransactions();
        
        // Calculate totals
        let totalIncome = 0;
        let totalExpenses = 0;
        let transactionCount = transactions.length;
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpenses += transaction.amount;
            }
        });
        
        const balance = totalIncome - totalExpenses;
        const savingsAmount = Math.max(0, balance);
        const savingsPercent = totalIncome > 0 
            ? ((savingsAmount / totalIncome) * 100).toFixed(2) 
            : 0;
        
        // Update UI
        incomeValue.textContent = formatCurrency(totalIncome);
        expensesValue.textContent = formatCurrency(totalExpenses);
        balanceValue.textContent = formatCurrency(balance);
        savingsValue.textContent = formatCurrency(savingsAmount);
        savingsPercent.textContent = savingsPercent + '%';
        
        // Update performance section
        performanceValue.textContent = formatCurrency(totalIncome);
        document.querySelector('.metric-value').textContent = transactionCount;
        document.querySelectorAll('.metric-value')[1].textContent = savingsPercent + '%';
        
        // Update progress bar
        const progressBar = document.querySelector('.progress-bar');
        const progressPercent = totalIncome > 0 
            ? Math.min(100, (balance / totalIncome) * 100) 
            : 0;
        
        progressBar.style.width = `${Math.max(0, progressPercent)}%`;
        
        if (progressPercent > 0) {
            progressBar.classList.remove('bg-danger');
            progressBar.classList.add('bg-success');
        } else {
            progressBar.classList.remove('bg-success');
            progressBar.classList.add('bg-danger');
        }
    }

    // Format currency with $ and thousand separators, and use compact form for large numbers
    function formatCurrency(amount) {
        return '$' + new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            notation: amount >= 1000000 ? 'compact' : 'standard',
            compactDisplay: 'short'
        }).format(amount);
    }
    
    // Functions for section-specific updates
    function updateIncomeSection() {
        // Get income transactions
        const incomeTransactions = state.transactions.filter(t => 
            t.type === 'income' && 
            t.date >= state.currentPeriod.startDate && 
            t.date <= state.currentPeriod.endDate
        );
        
        // Create income section content if not exists
        if (!document.getElementById('income-transactions-table')) {
            const incomeSection = document.getElementById('income-section');
            if (incomeSection) {
                incomeSection.innerHTML = `
                    <h4 class="mb-4">Ingresos</h4>
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Categoría</th>
                                            <th>Descripción</th>
                                            <th>Monto</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="income-transactions-table">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        // Populate income transactions table
        const incomeTable = document.getElementById('income-transactions-table');
        if (incomeTable) {
            incomeTable.innerHTML = '';
            
            if (incomeTransactions.length === 0) {
                incomeTable.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">No hay ingresos en el período seleccionado</td>
                    </tr>
                `;
                return;
            }
            
            // Sort by date (newest first)
            incomeTransactions.sort((a, b) => b.date - a.date);
            
            // Create table rows
            incomeTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                // Format date
                const date = transaction.date.toLocaleDateString('es-ES');
                
                row.innerHTML = `
                    <td>${date}</td>
                    <td>
                        <span class="category-badge category-income">${transaction.category}</span>
                    </td>
                    <td>${transaction.description}</td>
                    <td class="transaction-income">${formatCurrency(transaction.amount)}</td>
                    <td>
                        <button class="action-btn edit" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                // Add event listeners
                const editBtn = row.querySelector('.edit');
                const deleteBtn = row.querySelector('.delete');
                
                editBtn.addEventListener('click', () => editTransaction(transaction.id));
                deleteBtn.addEventListener('click', () => deleteTransaction(transaction.id));
                
                incomeTable.appendChild(row);
            });
        }
    }
    
    function updateExpensesSection() {
        // Get expense transactions
        const expenseTransactions = state.transactions.filter(t => 
            t.type === 'expense' && 
            t.date >= state.currentPeriod.startDate && 
            t.date <= state.currentPeriod.endDate
        );
        
        // Create expense section content if not exists
        if (!document.getElementById('expense-transactions-table')) {
            const expensesSection = document.getElementById('expenses-section');
            if (expensesSection) {
                expensesSection.innerHTML = `
                    <h4 class="mb-4">Gastos</h4>
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Categoría</th>
                                            <th>Descripción</th>
                                            <th>Monto</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="expense-transactions-table">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        // Populate expense transactions table
        const expenseTable = document.getElementById('expense-transactions-table');
        if (expenseTable) {
            expenseTable.innerHTML = '';
            
            if (expenseTransactions.length === 0) {
                expenseTable.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">No hay gastos en el período seleccionado</td>
                    </tr>
                `;
                return;
            }
            
            // Sort by date (newest first)
            expenseTransactions.sort((a, b) => b.date - a.date);
            
            // Create table rows
            expenseTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                // Format date
                const date = transaction.date.toLocaleDateString('es-ES');
                
                row.innerHTML = `
                    <td>${date}</td>
                    <td>
                        <span class="category-badge category-expense">${transaction.category}</span>
                    </td>
                    <td>${transaction.description}</td>
                    <td class="transaction-expense">${formatCurrency(transaction.amount)}</td>
                    <td>
                        <button class="action-btn edit" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                // Add event listeners
                const editBtn = row.querySelector('.edit');
                const deleteBtn = row.querySelector('.delete');
                
                editBtn.addEventListener('click', () => editTransaction(transaction.id));
                deleteBtn.addEventListener('click', () => deleteTransaction(transaction.id));
                
                expenseTable.appendChild(row);
            });
        }
    }

    // Save data to local storage
    function saveData() {
        localStorage.setItem('finanzas_transactions', JSON.stringify(state.transactions));
        localStorage.setItem('finanzas_categories', JSON.stringify(state.categories));
        localStorage.setItem('finanzas_piggy_bank', JSON.stringify(state.piggyBank));
    }

    // Load data from local storage
    function loadData() {
        const savedTransactions = localStorage.getItem('finanzas_transactions');
        const savedCategories = localStorage.getItem('finanzas_categories');
        const savedPiggyBank = localStorage.getItem('finanzas_piggy_bank');
        
        if (savedTransactions) {
            state.transactions = JSON.parse(savedTransactions);
            
            // Convert date strings to Date objects
            state.transactions.forEach(transaction => {
                transaction.date = new Date(transaction.date);
            });
        }
        
        if (savedCategories) {
            state.categories = JSON.parse(savedCategories);
        } else {
            // Use default categories
            state.categories = defaultCategories;
        }
        
        if (savedPiggyBank) {
            state.piggyBank = JSON.parse(savedPiggyBank);
            // Convert date strings to Date objects in history
            if (state.piggyBank.history) {
                state.piggyBank.history.forEach(entry => {
                    if (entry.date) {
                        entry.date = new Date(entry.date);
                    }
                });
            }
        }
    }

    // Update the entire dashboard
    function updateDashboard() {
        updateSummaryMetrics();
        updateTransactionsTable();
        updateCharts();
        updatePiggyBank();
        
        // Update current date range display
        const startFormatted = state.currentPeriod.startDate.toLocaleDateString('es-ES');
        const endFormatted = state.currentPeriod.endDate.toLocaleDateString('es-ES');
        currentDateRange.textContent = `${startFormatted} - ${endFormatted}`;
    }

    // Setup Piggy Bank functionality
    function setupPiggyBank() {
        // Show/hide piggy bank balance
        showPiggyBankBtn.addEventListener('click', function() {
            piggyBankHidden.style.display = 'none';
            piggyBankRevealed.style.display = 'block';
            
            // After 5 seconds, hide balance again
            setTimeout(function() {
                piggyBankHidden.style.display = 'block';
                piggyBankRevealed.style.display = 'none';
            }, 5000);
        });
        
        // Add to piggy bank
        addToPiggyBankBtn.addEventListener('click', function() {
            // Reset the form
            document.getElementById('piggy-bank-amount').value = '';
            document.getElementById('piggy-bank-description').value = '';
            
            // Set modal title
            document.getElementById('piggy-bank-modal-title').textContent = 'Añadir a Alcancía';
            
            // Show modal
            const piggyBankModal = new bootstrap.Modal(document.getElementById('piggy-bank-modal'));
            piggyBankModal.show();
            
            // Set save button action
            savePiggyBankBtn.onclick = function() {
                const amount = parseFloat(document.getElementById('piggy-bank-amount').value);
                const description = document.getElementById('piggy-bank-description').value.trim();
                
                if (isNaN(amount) || amount <= 0) {
                    alert('Por favor, ingrese un monto válido mayor a cero.');
                    return;
                }
                
                // Add to piggy bank
                state.piggyBank.balance += amount;
                
                // Add to history
                state.piggyBank.history.push({
                    date: new Date(),
                    type: 'deposit',
                    amount: amount,
                    description: description || 'Depósito a Alcancía'
                });
                
                // Save data
                saveData();
                
                // Update UI
                updatePiggyBank();
                
                // Close modal
                piggyBankModal.hide();
            };
        });
        
        // Withdraw from piggy bank
        withdrawFromPiggyBankBtn.addEventListener('click', function() {
            // Reset the form
            document.getElementById('piggy-bank-amount').value = '';
            document.getElementById('piggy-bank-description').value = '';
            
            // Set modal title
            document.getElementById('piggy-bank-modal-title').textContent = 'Retirar de Alcancía';
            
            // Show modal
            const piggyBankModal = new bootstrap.Modal(document.getElementById('piggy-bank-modal'));
            piggyBankModal.show();
            
            // Set save button action
            savePiggyBankBtn.onclick = function() {
                const amount = parseFloat(document.getElementById('piggy-bank-amount').value);
                const description = document.getElementById('piggy-bank-description').value.trim();
                
                if (isNaN(amount) || amount <= 0) {
                    alert('Por favor, ingrese un monto válido mayor a cero.');
                    return;
                }
                
                if (amount > state.piggyBank.balance) {
                    alert('No tiene suficiente saldo en su alcancía para retirar esa cantidad.');
                    return;
                }
                
                // Withdraw from piggy bank
                state.piggyBank.balance -= amount;
                
                // Add to history
                state.piggyBank.history.push({
                    date: new Date(),
                    type: 'withdrawal',
                    amount: amount,
                    description: description || 'Retiro de Alcancía'
                });
                
                // Save data
                saveData();
                
                // Update UI
                updatePiggyBank();
                
                // Close modal
                piggyBankModal.hide();
            };
        });
        
        // Update piggy bank UI
        updatePiggyBank();
    }
    
    // Update piggy bank UI
    function updatePiggyBank() {
        // Update balance
        piggyBankValue.textContent = formatCurrency(state.piggyBank.balance);
        
        // Update progress bar - set to 50% full as a visual indicator
        const progressPercent = Math.min(100, Math.max(0, state.piggyBank.balance > 0 ? 50 : 0));
        piggyBankProgress.style.width = progressPercent + '%';
    }

    function initialize() {
        // Load saved data
        loadData();
        
        // Initialize date filters
        initializeDateFilters();
        
        // Setup transaction modal
        setupTransactionModal();
        
        // Setup category management
        setupCategoryManagement();
        
        // Setup piggy bank
        setupPiggyBank();
        
        // Initialize charts
        initializeCharts();
        
        // Update dashboard
        updateDashboard();
    }

    // Start the application
    initialize();
});
