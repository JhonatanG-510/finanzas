// Finanzas Personales Dashboard Script
$(document).ready(function() {
    // Crear un objeto para almacenar las instancias de gráficos
    const chartInstances = {};

    // Función personalizada para obtener o crear gráficos
    function getOrCreateChart(chartId) {
        return chartInstances[chartId] || null;
    }

    // Initialize Bootstrap components
    const transactionModal = new bootstrap.Modal(document.getElementById('transaction-modal'));
    const categoryModal = new bootstrap.Modal(document.getElementById('category-modal'));
    const piggyBankModal = new bootstrap.Modal(document.getElementById('piggy-bank-modal'));

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
        },
        settings: {
            theme: 'light',
            enableAnimations: true,
            monthlySavingsGoal: 0,
            budgetLimit: 0,
            enableBudgetAlerts: true
        }
    };

    // DOM Elements
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const periodSelector = document.getElementById('period-selector');
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const saveTransactionBtn = document.getElementById('save-transaction');
    const transactionForm = document.getElementById('transaction-form');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const transactionCategorySelect = document.getElementById('transaction-category');
    const transactionsTable = document.getElementById('transactions-table');
    const noTransactionsMsg = document.getElementById('no-transactions');
    const categoryForm = document.getElementById('category-form');
    const saveCategoryBtn = document.getElementById('save-category');
    const addIncomeCategoryBtn = document.getElementById('add-income-category');
    const addExpenseCategoryBtn = document.getElementById('add-expense-category');

    // Valores métricas
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

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Show the corresponding section
            const linkId = this.id;
            if (linkId === 'dashboard-link') {
                showSection('dashboard-section');
                updateDashboard();
            } else if (linkId === 'transactions-link') {
                showSection('transactions-section');
                updateTransactionsTable();
            } else if (linkId === 'income-link') {
                showSection('income-section');
                // Implementar la actualización de la sección de ingresos
            } else if (linkId === 'expenses-link') {
                showSection('expenses-section');
                // Implementar la actualización de la sección de gastos
            } else if (linkId === 'categories-link') {
                showSection('categories-section');
                updateCategoryLists();
            } else if (linkId === 'reports-link') {
                showSection('reports-section');
                initializeReportsSection();
            } else if (linkId === 'settings-link') {
                showSection('settings-section');
                initializeSettingsSection();
            }
        });
    });

    // Initialize date filters
    function initializeDateFilters() {
        const today = new Date();
        const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Set initial dates
        if (startDateInput && endDateInput) {
            // Initialize jQuery UI datepicker
            try {
                $(startDateInput).datepicker({
                    dateFormat: 'dd/mm/yy',
                    changeMonth: true,
                    changeYear: true,
                    onSelect: function() {
                        updateDateFilter();
                    }
                });

                $(endDateInput).datepicker({
                    dateFormat: 'dd/mm/yy',
                    changeMonth: true,
                    changeYear: true,
                    onSelect: function() {
                        updateDateFilter();
                    }
                });

                // Set initial values
                $(startDateInput).datepicker('setDate', firstDayMonth);
                $(endDateInput).datepicker('setDate', lastDayMonth);

                state.currentPeriod.startDate = firstDayMonth;
                state.currentPeriod.endDate = lastDayMonth;
            } catch (error) {
                console.error("Error initializing datepicker:", error);
                // Fallback for datepicker
                startDateInput.valueAsDate = firstDayMonth;
                endDateInput.valueAsDate = lastDayMonth;

                state.currentPeriod.startDate = firstDayMonth;
                state.currentPeriod.endDate = lastDayMonth;
            }
        }

        // Period selector change
        if (periodSelector) {
            periodSelector.addEventListener('change', function() {
                const selectedPeriod = this.value;
                const now = new Date();

                switch(selectedPeriod) {
                    case 'current-month':
                        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        const lastDayCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        try {
                            $(startDateInput).datepicker('setDate', firstDayCurrentMonth);
                            $(endDateInput).datepicker('setDate', lastDayCurrentMonth);
                        } catch (error) {
                            startDateInput.valueAsDate = firstDayCurrentMonth;
                            endDateInput.valueAsDate = lastDayCurrentMonth;
                        }
                        break;
                    case 'last-month':
                        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                        try {
                            $(startDateInput).datepicker('setDate', firstDayLastMonth);
                            $(endDateInput).datepicker('setDate', lastDayLastMonth);
                        } catch (error) {
                            startDateInput.valueAsDate = firstDayLastMonth;
                            endDateInput.valueAsDate = lastDayLastMonth;
                        }
                        break;
                    case 'current-year':
                        const firstDayYear = new Date(now.getFullYear(), 0, 1);
                        const lastDayYear = new Date(now.getFullYear(), 11, 31);
                        try {
                            $(startDateInput).datepicker('setDate', firstDayYear);
                            $(endDateInput).datepicker('setDate', lastDayYear);
                        } catch (error) {
                            startDateInput.valueAsDate = firstDayYear;
                            endDateInput.valueAsDate = lastDayYear;
                        }
                        break;
                    case 'custom':
                        // Just use the current selected dates
                        break;
                }

                updateDateFilter();
            });
        }
    }

    // Parse a date from the datepicker format
    function parseInputDate(dateStr) {
        if (!dateStr) return new Date();

        // Try parsing date in format DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-based in JS Date
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }

        // Try parsing ISO format (YYYY-MM-DD)
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
        } catch (e) {
            console.error("Error parsing date:", e);
        }

        return new Date();
    }

    // Format date for input fields
    function formatDateForInput(date) {
        if (!date) return '';

        try {
            // For jQuery datepicker fields (DD/MM/YYYY)
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error("Error formatting date:", error);
            return '';
        }
    }

    // Update date filter and refresh data
    function updateDateFilter() {
        try {
            // Get dates from inputs
            if (startDateInput && endDateInput) {
                let startDate, endDate;

                try {
                    startDate = $(startDateInput).datepicker('getDate');
                    endDate = $(endDateInput).datepicker('getDate');
                } catch (error) {
                    startDate = parseInputDate(startDateInput.value);
                    endDate = parseInputDate(endDateInput.value);
                }

                if (startDate && endDate) {
                    state.currentPeriod.startDate = startDate;
                    state.currentPeriod.endDate = endDate;

                    // Update period selector if dates match a predefined period
                    updatePeriodSelector();

                    // Update dashboard with new date range
                    updateDashboard();
                }
            }
        } catch (error) {
            console.error("Error updating date filter:", error);
        }
    }

    // Update period selector based on current dates
    function updatePeriodSelector() {
        if (!periodSelector) return;

        try {
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
        } catch (error) {
            console.error("Error updating period selector:", error);
        }
    }

    // Setup Transaction Modal
    function setupTransactionModal() {
        if (!transactionModal) return;

        try {
            // Initialize datepicker for transaction date
            $("#transaction-date").datepicker({
                dateFormat: 'dd/mm/yy',
                changeMonth: true,
                changeYear: true
            });

            // Default to today's date
            $("#transaction-date").datepicker('setDate', new Date());
        } catch (error) {
            console.error("Error setting up transaction date picker:", error);
        }

        // Add Transaction Button
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', function() {
                openAddTransactionModal();
            });
        }

        // Add First Transaction Button
        const addFirstTransactionBtn = document.getElementById('add-first-transaction');
        if (addFirstTransactionBtn) {
            addFirstTransactionBtn.addEventListener('click', function() {
                openAddTransactionModal();
            });
        }

        // Transaction Type Change
        if (transactionTypeSelect) {
            transactionTypeSelect.addEventListener('change', function() {
                updateCategoryDropdown(this.value);
            });
        }

        // Save Transaction Button
        if (saveTransactionBtn) {
            saveTransactionBtn.addEventListener('click', saveTransaction);
        }
    }

    // Open Add Transaction Modal
    function openAddTransactionModal() {
        if (!transactionModal) return;

        state.editingTransactionId = null;

        // Reset form
        if (document.getElementById('transaction-modal-title')) {
            document.getElementById('transaction-modal-title').textContent = 'Agregar Transacción';
        }

        if (document.getElementById('transaction-id')) {
            document.getElementById('transaction-id').value = '';
        }

        try {
            $("#transaction-date").datepicker('setDate', new Date());
        } catch (error) {
            if (document.getElementById('transaction-date')) {
                document.getElementById('transaction-date').valueAsDate = new Date();
            }
        }

        if (transactionTypeSelect) {
            transactionTypeSelect.value = 'income';
            updateCategoryDropdown('income');
        }

        if (document.getElementById('transaction-description')) {
            document.getElementById('transaction-description').value = '';
        }

        if (document.getElementById('transaction-amount')) {
            document.getElementById('transaction-amount').value = '';
        }

        // Mostrar/ocultar opción de alcancía según el tipo
        const piggyBankOption = document.getElementById('piggy-bank-option');
        if (piggyBankOption) {
            piggyBankOption.style.display = transactionTypeSelect.value === 'income' ? 'block' : 'none';
        }

        // Show modal
        transactionModal.show();
    }

    // Update category dropdown based on transaction type
    function updateCategoryDropdown(type) {
        if (!transactionCategorySelect) return;

        try {
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
                    // Reset to first category
                    setTimeout(() => {
                        if (categories.length > 0) {
                            this.value = categories[0];
                        } else {
                            this.selectedIndex = 0;
                        }
                    }, 10);

                    // Set type in category modal
                    if (document.getElementById('category-type')) {
                        document.getElementById('category-type').value = type;
                    }

                    // Show category modal
                    if (categoryModal) {
                        categoryModal.show();
                    }
                }
            });
        } catch (error) {
            console.error("Error updating category dropdown:", error);
        }
    }

    // Save transaction
    function saveTransaction() {
        try {
            const form = document.getElementById('transaction-form');

            // Basic form validation
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const transactionId = document.getElementById('transaction-id') ? 
                document.getElementById('transaction-id').value : '';

            let date;
            try {
                date = $("#transaction-date").datepicker('getDate');
            } catch (error) {
                const dateStr = document.getElementById('transaction-date') ? 
                    document.getElementById('transaction-date').value : '';
                date = parseInputDate(dateStr);
            }

            const type = transactionTypeSelect ? transactionTypeSelect.value : 'income';
            const category = transactionCategorySelect ? transactionCategorySelect.value : '';
            const description = document.getElementById('transaction-description') ? 
                document.getElementById('transaction-description').value : '';

            const amountStr = document.getElementById('transaction-amount') ? 
                document.getElementById('transaction-amount').value : '0';
            const amount = parseFloat(amountStr);

            if (isNaN(amount) || amount <= 0) {
                alert('Por favor, ingrese un monto válido mayor a cero.');
                return;
            }

            if (!category || category === 'new') {
                alert('Por favor, seleccione una categoría válida.');
                return;
            }

            // Confirmar que estamos creando la transacción con el tipo correcto
            console.log('Creando transacción de tipo:', type, 'por valor de:', amount);

            const transaction = {
                id: transactionId || Date.now().toString(),
                date: date,
                type: type,
                category: category,
                description: description,
                amount: amount
            };

            // Check if adding to piggy bank (for income only)
            const addToPiggyBankCheck = document.getElementById('add-to-piggy-bank-check');
            const addToPiggyBank = type === 'income' && addToPiggyBankCheck && addToPiggyBankCheck.checked;

            // If editing, update existing transaction
            if (state.editingTransactionId) {
                const index = state.transactions.findIndex(t => t.id === state.editingTransactionId);
                if (index !== -1) {
                    state.transactions[index] = transaction;
                }
            } else {
                // Add new transaction with proper type
                transaction.type = type; // Asegurarnos que el tipo esté correctamente asignado
                state.transactions.push(transaction);
                console.log('Nueva transacción agregada:', transaction);

                // Solo agregar a alcancía si es un ingreso y el checkbox está marcado
                if (type === 'income' && addToPiggyBankCheck && addToPiggyBankCheck.checked) {
                    const piggyBankAmount = amount * 0.1; // 10% a alcancía
                    state.piggyBank.balance += piggyBankAmount;

                    // Registrar en historial
                    state.piggyBank.history.push({
                        date: new Date(),
                        type: 'deposit',
                        amount: piggyBankAmount,
                        description: `10% de "${description}"`
                    });
                }
            }

            // Save to local storage
            saveData();

            // Update UI
            updateDashboard();
            updateTransactionsTable();
            updateIncomeSection();
            updateExpensesSection();
            console.log('Estado actual:', state.transactions);

            // Close modal
            if (transactionModal) {
                transactionModal.hide();
            }
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert('Ocurrió un error al guardar la transacción. Por favor, intente nuevamente.');
        }
    }

    // Setup Category Management
    function setupCategoryManagement() {
        // Add Category Form Submit
        if (categoryForm) {
            categoryForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveCategory();
            });
        }

        // Save Category Button
        if (saveCategoryBtn) {
            saveCategoryBtn.addEventListener('click', function() {
                saveCategory();
            });
        }

        // Add Income Category Button
        if (addIncomeCategoryBtn) {
            addIncomeCategoryBtn.addEventListener('click', function() {
                if (document.getElementById('category-type')) {
                    document.getElementById('category-type').value = 'income';
                }

                if (document.getElementById('category-name')) {
                    document.getElementById('category-name').value = '';
                }

                if (categoryModal) {
                    categoryModal.show();
                }
            });
        }

        // Add Expense Category Button
        if (addExpenseCategoryBtn) {
            addExpenseCategoryBtn.addEventListener('click', function() {
                if (document.getElementById('category-type')) {
                    document.getElementById('category-type').value = 'expense';
                }

                if (document.getElementById('category-name')) {
                    document.getElementById('category-name').value = '';
                }

                if (categoryModal) {
                    categoryModal.show();
                }
            });
        }
    }

    // Save Category
    function saveCategory() {
        try {
            const typeSelect = document.getElementById('category-type');
            const nameInput = document.getElementById('category-name');

            if (!typeSelect || !nameInput) {
                console.error("Category form elements not found");
                return;
            }

            const type = typeSelect.value;
            const name = nameInput.value.trim();

            if (!name) {
                alert('Por favor, ingrese un nombre para la categoría.');
                return;
            }

            // Check if category already exists
            if (state.categories[type] && state.categories[type].includes(name)) {
                alert('Esta categoría ya existe.');
                return;
            }

            // Ensure category arrays exist
            if (!state.categories.income) state.categories.income = [];
            if (!state.categories.expense) state.categories.expense = [];

            // Add category
            state.categories[type].push(name);

            // Save to local storage
            saveData();

            // Update UI
            updateCategoryLists();
            if (transactionTypeSelect && transactionCategorySelect) {
                updateCategoryDropdown(transactionTypeSelect.value);
            }

            // Reset form and close modal
            nameInput.value = '';
            if (categoryModal) {
                categoryModal.hide();
            }
        } catch (error) {
            console.error("Error saving category:", error);
            alert('Ocurrió un error al guardar la categoría. Por favor, intente nuevamente.');
        }
    }

    // Update category lists
    function updateCategoryLists() {
        try {
            const incomeList = document.getElementById('income-categories-list');
            const expenseList = document.getElementById('expense-categories-list');

            if (!incomeList || !expenseList) {
                return;
            }

            // Clear lists
            incomeList.innerHTML = '';
            expenseList.innerHTML = '';

            // Check for empty state
            const incomeAlert = document.getElementById('income-category-alert');
            const expenseAlert = document.getElementById('expense-category-alert');

            if (incomeAlert) {
                incomeAlert.style.display = state.categories.income.length === 0 ? 'block' : 'none';
            }

            if (expenseAlert) {
                expenseAlert.style.display = state.categories.expense.length === 0 ? 'block' : 'none';
            }

            // Add income categories
            state.categories.income.forEach(category => {
                const item = createCategoryListItem(category, 'income');
                incomeList.appendChild(item);
            });

            // Add expense categories
            state.categories.expense.forEach(category => {
                const item = createCategoryListItem(category, 'expense');
                expenseList.appendChild(item);
            });
        } catch (error) {
            console.error("Error updating category lists:", error);
        }
    }

    // Create category list item
    function createCategoryListItem(category, type) {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = category;
        item.appendChild(nameSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Eliminar categoría';

        deleteBtn.addEventListener('click', function() {
            deleteCategory(category, type);
        });

        item.appendChild(deleteBtn);

        return item;
    }

    // Delete category
    function deleteCategory(category, type) {
        try {
            // Check if category is in use
            const inUse = state.transactions.some(t => t.type === type && t.category === category);

            if (inUse) {
                // Para categorías en uso, ofrecer tres opciones
                const action = confirm('Esta categoría está en uso en algunas transacciones. ¿Desea eliminarla y todas las transacciones asociadas?');

                if (action) {
                    // Eliminar la categoría y todas las transacciones asociadas
                    state.transactions = state.transactions.filter(t => !(t.type === type && t.category === category));
                    state.categories[type] = state.categories[type].filter(c => c !== category);

                    // Guardar y actualizar UI
                    saveData();
                    updateCategoryLists();
                    if (transactionTypeSelect && transactionCategorySelect) {
                        updateCategoryDropdown(transactionTypeSelect.value);
                    }
                    updateDashboard();
                }
            } else {
                // Si no está en uso, solo confirmar eliminación
                if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
                    // Eliminar la categoría
                    state.categories[type] = state.categories[type].filter(c => c !== category);

                    // Guardar y actualizar UI
                    saveData();
                    updateCategoryLists();
                    if (transactionTypeSelect && transactionCategorySelect) {
                        updateCategoryDropdown(transactionTypeSelect.value);
                    }
                    updateDashboard();
                }
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            alert('Ocurrió un error al eliminar la categoría. Por favor, intente nuevamente.');
        }
    }

    // Setup Piggy Bank functionality
    function setupPiggyBank() {
        if (!showPiggyBankBtn || !piggyBankHidden || !piggyBankRevealed) return;

        // Show balance button
        showPiggyBankBtn.addEventListener('click', function() {
            piggyBankHidden.style.display = 'none';
            piggyBankRevealed.style.display = 'block';
            this.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Balance';

            // Toggle back after 5 seconds
            setTimeout(() => {
                piggyBankHidden.style.display = 'block';
                piggyBankRevealed.style.display = 'none';
                this.innerHTML = '<i class="fas fa-eye"></i> Ver Balance';
            }, 5000);
        });

        // Add to piggy bank button
        if (addToPiggyBankBtn) {
            addToPiggyBankBtn.addEventListener('click', function() {
                if (piggyBankModal) {
                    document.getElementById('piggy-bank-modal-label').textContent = 'Añadir a Alcancía';
                    document.getElementById('piggy-bank-amount').value = '';
                    document.getElementById('piggy-bank-description').value = 'Ahorro manual';

                    // Set action type
                    const actionTypeInput = document.createElement('input');
                    actionTypeInput.type = 'hidden';
                    actionTypeInput.id = 'piggy-bank-action-type';
                    actionTypeInput.value = 'deposit';

                    const existingInput = document.getElementById('piggy-bank-action-type');
                    if (existingInput) {
                        existingInput.value = 'deposit';
                    } else {
                        document.getElementById('piggy-bank-form').appendChild(actionTypeInput);
                    }

                    piggyBankModal.show();
                }
            });
        }

        // Withdraw from piggy bank button
        if (withdrawFromPiggyBankBtn) {
            withdrawFromPiggyBankBtn.addEventListener('click', function() {
                if (piggyBankModal) {
                    document.getElementById('piggy-bank-modal-label').textContent = 'Retirar de Alcancía';
                    document.getElementById('piggy-bank-amount').value = '';
                    document.getElementById('piggy-bank-description').value = 'Retiro manual';

                    // Set action type
                    const actionTypeInput = document.createElement('input');
                    actionTypeInput.type = 'hidden';
                    actionTypeInput.id = 'piggy-bank-action-type';
                    actionTypeInput.value = 'withdrawal';

                    const existingInput = document.getElementById('piggy-bank-action-type');
                    if (existingInput) {
                        existingInput.value = 'withdrawal';
                    } else {
                        document.getElementById('piggy-bank-form').appendChild(actionTypeInput);
                    }

                    piggyBankModal.show();
                }
            });
        }

        // Save piggy bank operation
        if (savePiggyBankBtn) {
            savePiggyBankBtn.addEventListener('click', function() {
                const amountInput = document.getElementById('piggy-bank-amount');
                const descriptionInput = document.getElementById('piggy-bank-description');
                const actionTypeInput = document.getElementById('piggy-bank-action-type');

                if (!amountInput || !descriptionInput || !actionTypeInput) return;

                const amount = parseFloat(amountInput.value);
                const description = descriptionInput.value.trim();
                const actionType = actionTypeInput.value;

                if (isNaN(amount) || amount <= 0) {
                    alert('Por favor, ingrese un monto válido mayor a cero.');
                    return;
                }

                if (actionType === 'withdrawal' && amount > state.piggyBank.balance) {
                    alert('No puede retirar más de lo que tiene en la alcancía.');
                    return;
                }

                if (actionType === 'deposit') {
                    // Add to piggy bank
                    state.piggyBank.balance += amount;

                    // Add to history
                    state.piggyBank.history.push({
                        date: new Date(),
                        type: 'deposit',
                        amount: amount,
                        description: description || 'Depósito en Alcancía'
                    });
                } else {
                    // Withdraw from piggy bank
                    state.piggyBank.balance -= amount;

                    // Add to history
                    state.piggyBank.history.push({
                        date: new Date(),
                        type: 'withdrawal',
                        amount: amount,
                        description: description || 'Retiro de Alcancía'
                    });
                }

                // Save data
                saveData();

                // Update UI
                updatePiggyBank();

                // Close modal
                if (piggyBankModal) {
                    piggyBankModal.hide();
                }
            });
        }

        // Initialize piggy bank display
        updatePiggyBank();
    }

    // Update piggy bank UI
    function updatePiggyBank() {
        if (piggyBankValue) {
            piggyBankValue.textContent = formatCurrency(state.piggyBank.balance);
        }

        if (piggyBankProgress) {
            // Set to 50% full as a visual indicator when there's balance
            const progressPercent = Math.min(100, Math.max(0, state.piggyBank.balance > 0 ? 50 : 0));
            piggyBankProgress.style.width = progressPercent + '%';
        }
    }

    // Initialize Reports Section
    function initializeReportsSection() {
        const reportTypeSelect = document.getElementById('report-type');
        const reportStartDate = document.getElementById('report-start-date');
        const reportEndDate = document.getElementById('report-end-date');
        const generateReportBtn = document.getElementById('generate-report');

        if (!reportTypeSelect || !reportStartDate || !reportEndDate || !generateReportBtn) {
            return;
        }

        try {
            //            // Initialize datepickers
            const today = new Date();
            const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            $(reportStartDate).datepicker({
                dateFormat: 'dd/mm/yy',
                changeMonth: true,
                changeYear: true
            });

            $(reportEndDate).datepicker({
                dateFormat: 'dd/mm/yy',
                changeMonth: true,
                changeYear: true
            });

            $(reportStartDate).datepicker('setDate', firstDayMonth);
            $(reportEndDate).datepicker('setDate', lastDayMonth);
        } catch (error) {
            console.error("Error initializing report datepickers:", error);

            // Fallback
            if (reportStartDate.type === 'date') {
                reportStartDate.valueAsDate = firstDayMonth;
            }

            if (reportEndDate.type === 'date') {
                reportEndDate.valueAsDate = lastDayMonth;
            }
        }

        // Report type change
        reportTypeSelect.addEventListener('change', function() {
            generateReport();
        });

        // Generate report button
        generateReportBtn.addEventListener('click', function() {
            generateReport();
        });

        // Export buttons
        const exportReportPDFBtn = document.getElementById('export-report-pdf');
        const exportReportCSVBtn = document.getElementById('export-report-csv');

        if (exportReportPDFBtn) {
            exportReportPDFBtn.addEventListener('click', function() {
                alert('La exportación a PDF estará disponible próximamente.');
            });
        }

        if (exportReportCSVBtn) {
            exportReportCSVBtn.addEventListener('click', function() {
                exportReportToCSV();
            });
        }

        // Generate initial report
        generateReport();
    }

    // Generate Report
    function generateReport() {
        try {
            const reportTypeSelect = document.getElementById('report-type');
            const reportStartDate = document.getElementById('report-start-date');
            const reportEndDate = document.getElementById('report-end-date');

            if (!reportTypeSelect || !reportStartDate || !reportEndDate) {
                return;
            }

            const reportType = reportTypeSelect.value;

            // Get date ranges
            let startDate, endDate;

            try {
                startDate = $(reportStartDate).datepicker('getDate');
                endDate = $(reportEndDate).datepicker('getDate');
            } catch (error) {
                startDate = parseInputDate(reportStartDate.value);
                endDate = parseInputDate(reportEndDate.value);
            }

            // Hide all report sections
            document.querySelectorAll('.report-section').forEach(section => {
                section.style.display = 'none';
            });

            // Show selected report section
            const reportSection = document.getElementById(`${reportType}-report`);
            if (reportSection) {
                reportSection.style.display = 'block';
            }

            // Filter transactions for the selected period
            const filteredTransactions = state.transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            });

            // Generate the appropriate report
            switch (reportType) {
                case 'monthly-summary':
                    generateMonthlySummaryReport(filteredTransactions, startDate, endDate);
                    break;
                case 'category-analysis':
                    generateCategoryAnalysisReport(filteredTransactions, startDate, endDate);
                    break;
                case 'trends-analysis':
                    generateTrendsAnalysisReport(filteredTransactions, startDate, endDate);
                    break;
                case 'cashflow':
                    generateCashflowReport(filteredTransactions, startDate, endDate);
                    break;
                case 'savings-analysis':
                    generateSavingsAnalysisReport(filteredTransactions, startDate, endDate);
                    break;
            }
        } catch (error) {
            console.error("Error generating report:", error);
        }
    }

    // Export report to CSV
    function exportReportToCSV() {
        try {
            const reportTypeSelect = document.getElementById('report-type');
            const reportStartDate = document.getElementById('report-start-date');
            const reportEndDate = document.getElementById('report-end-date');

            if (!reportTypeSelect || !reportStartDate || !reportEndDate) {
                return;
            }

            const reportType = reportTypeSelect.value;

            // Get date ranges
            let startDate, endDate;

            try {
                startDate = $(reportStartDate).datepicker('getDate');
                endDate = $(reportEndDate).datepicker('getDate');
            } catch (error) {
                startDate = parseInputDate(reportStartDate.value);
                endDate = parseInputDate(reportEndDate.value);
            }

            // Filter transactions
            const filteredTransactions = state.transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            });

            // Format dates for filename
            const startFormatted = formatDateForInput(startDate).replace(/\//g, '-');
            const endFormatted = formatDateForInput(endDate).replace(/\//g, '-');

            // Generate CSV content
            let csvContent = 'data:text/csv;charset=utf-8,';

            // Headers
            csvContent += 'Fecha,Tipo,Categoría,Descripción,Monto\n';

            // Rows
            filteredTransactions.forEach(t => {
                const date = formatDateForInput(new Date(t.date));
                const type = t.type === 'income' ? 'Ingreso' : 'Gasto';
                const row = [
                    date,
                    type,
                    t.category,
                    `"${t.description.replace(/"/g, '""')}"`,
                    t.amount
                ].join(',');

                csvContent += row + '\n';
            });

            // Create download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `FinanzApp_${reportType}_${startFormatted}_${endFormatted}.csv`);
            document.body.appendChild(link);

            // Download
            link.click();

            // Clean up
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exporting report:", error);
            alert('Ocurrió un error al exportar el reporte.');
        }
    }

    // Generate Monthly Summary Report
    function generateMonthlySummaryReport(transactions, startDate, endDate) {
        try {
            // Calculate summary metrics
            const incomeTransactions = transactions.filter(t => t.type === 'income');
            const expenseTransactions = transactions.filter(t => t.type === 'expense');

            const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
            const balance = totalIncome - totalExpenses;
            const savings = Math.max(0, balance);

            // Update summary values
            const reportTotalIncome = document.getElementById('report-total-income');
            const reportTotalExpenses = document.getElementById('report-total-expenses');
            const reportBalance = document.getElementById('report-balance');
            const reportSavings = document.getElementById('report-savings');

            if (reportTotalIncome) reportTotalIncome.textContent = formatCurrency(totalIncome);
            if (reportTotalExpenses) reportTotalExpenses.textContent = formatCurrency(totalExpenses);
            if (reportBalance) reportBalance.textContent = formatCurrency(balance);
            if (reportSavings) reportSavings.textContent = formatCurrency(savings);

            // Calculate additional statistics
            const highestIncome = incomeTransactions.length > 0 ? 
                Math.max(...incomeTransactions.map(t => t.amount)) : 0;

            const highestExpense = expenseTransactions.length > 0 ? 
                Math.max(...expenseTransactions.map(t => t.amount)) : 0;

            const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            const avgDailyExpense = diffDays > 0 ? totalExpenses / diffDays : 0;

            // Count days without expenses
            const daysWithExpenses = new Set();
            expenseTransactions.forEach(t => {
                const dateStr = new Date(t.date).toISOString().split('T')[0];
                daysWithExpenses.add(dateStr);
            });

            const noExpenseDays = diffDays - daysWithExpenses.size;

            // Update additional statistics
            const reportHighestIncome = document.getElementById('report-highest-income');
            const reportHighestExpense = document.getElementById('report-highest-expense');
            const reportAvgDailyExpense = document.getElementById('report-avg-daily-expense');
            const reportNoExpenseDays = document.getElementById('report-no-expense-days');

            if (reportHighestIncome) reportHighestIncome.textContent = formatCurrency(highestIncome);
            if (reportHighestExpense) reportHighestExpense.textContent = formatCurrency(highestExpense);
            if (reportAvgDailyExpense) reportAvgDailyExpense.textContent = formatCurrency(avgDailyExpense);
            if (reportNoExpenseDays) reportNoExpenseDays.textContent = noExpenseDays.toString();

            // Update chart
            updateMonthlySummaryChart(transactions, startDate, endDate);
        } catch (error) {
            console.error("Error generating monthly summary report:", error);
        }
    }

    // Update Monthly Summary Chart
    function updateMonthlySummaryChart(transactions, startDate, endDate) {
        const chartElement = document.getElementById('monthly-summary-chart');
        if (!chartElement) return;

        try {
            // Group transactions by date
            const dailyData = {};
            const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

            // Initialize all dates in range
            for (let i = 0; i <= diffDays; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];

                dailyData[dateStr] = {
                    income: 0,
                    expense: 0
                };
            }

            // Aggregate transactions
            transactions.forEach(t => {
                const date = new Date(t.date);
                const dateStr = date.toISOString().split('T')[0];

                if (dailyData[dateStr]) {
                    if (t.type === 'income') {
                        dailyData[dateStr].income += t.amount;
                    } else {
                        dailyData[dateStr].expense += t.amount;
                    }
                }
            });

            // Prepare chart data
            const dates = Object.keys(dailyData).sort();
            const formattedDates = dates.map(dateStr => {
                const date = new Date(dateStr);
                return `${date.getDate()}/${date.getMonth() + 1}`;
            });

            const incomeData = dates.map(date => dailyData[date].income);
            const expenseData = dates.map(date => dailyData[date].expense);
            const balanceData = dates.map(date => dailyData[date].income - dailyData[date].expense);

            // Create/update chart
            const chartConfig = {
                type: 'bar',
                data: {
                    labels: formattedDates,
                    datasets: [
                        {
                            label: 'Ingresos',
                            backgroundColor: 'rgba(54, 179, 126, 0.7)',
                            borderColor: 'rgba(54, 179, 126, 1)',
                            borderWidth: 1,
                            data: incomeData
                        },
                        {
                            label: 'Gastos',
                            backgroundColor: 'rgba(255, 86, 48, 0.7)',
                            borderColor: 'rgba(255, 86, 48, 1)',
                            borderWidth: 1,
                            data: expenseData
                        },
                        {
                            label: 'Balance',
                            type: 'line',
                            borderColor: 'rgba(13, 110, 253, 1)',
                            backgroundColor: 'rgba(13, 110, 253, 0.1)',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            data: balanceData
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Fecha'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Monto ($)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                                }
                            }
                        }
                    }
                }
            };

            // Check if chart already exists and destroy it
            if (chartInstances['monthly-summary-chart']) {
                chartInstances['monthly-summary-chart'].destroy();
            }

            // Create new chart
            chartInstances['monthly-summary-chart'] = new Chart(chartElement, chartConfig);
        } catch (error) {
            console.error("Error updating monthly summary chart:", error);
        }
    }

    // Generate Category Analysis Report
    function generateCategoryAnalysisReport(transactions, startDate, endDate) {
        try {
            // Filter transactions by type
            const incomeTransactions = transactions.filter(t => t.type === 'income');
            const expenseTransactions = transactions.filter(t => t.type === 'expense');

            // Update income categories chart
            updateCategoryAnalysisChart('income', incomeTransactions);

            // Update expense categories chart
            updateCategoryAnalysisChart('expense', expenseTransactions);
        } catch (error) {
            console.error("Error generating category analysis report:", error);
        }
    }

    // Update Category Analysis Chart
    function updateCategoryAnalysisChart(type, transactions) {
        const chartId = `${type}-category-analysis-chart`;
        const chartElement = document.getElementById(chartId);

        if (!chartElement) return;

        try {
            // Group by category
            const categoryData = {};

            // Initialize with all categories
            if (state.categories[type]) {
                state.categories[type].forEach(category => {
                    categoryData[category] = 0;
                });
            }

            // Aggregate transactions
            transactions.forEach(t => {
                if (t.category) {
                    if (categoryData[t.category] === undefined) {
                        categoryData[t.category] = 0;
                    }
                    categoryData[t.category] += t.amount;
                }
            });

            // Sort categories by amount
            const sortedCategories = Object.entries(categoryData)
                .filter(([_, amount]) => amount > 0)
                .sort(([_, a], [__, b]) => b - a);

            const categories = sortedCategories.map(([category]) => category);
            const amounts = sortedCategories.map(([_, amount]) => amount);

            // Generate colors
            const colors = categories.map((_, i) => {
                const hue = Math.round(i * (360 / categories.length));
                return {
                    backgroundColor: `hsla(${hue}, 70%, 60%, 0.7)`,
                    borderColor: `hsla(${hue}, 70%, 60%, 1)`
                };
            });

            // Create chart config
            const chartConfig = {
                type: 'bar',
                data: {
                    labels: categories,
                    datasets: [{
                        label: type === 'income' ? 'Ingresos por Categoría' : 'Gastos por Categoría',
                        backgroundColor: colors.map(c => c.backgroundColor),
                        borderColor: colors.map(c => c.borderColor),
                        borderWidth: 1,
                        data: amounts
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.x;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${formatCurrency(value)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            };

            // Check if chart already exists and destroy it
            if (chartInstances[chartId]) {
                chartInstances[chartId].destroy();
            }

            // Create new chart
            chartInstances[chartId] = new Chart(chartElement, chartConfig);

            // Update top categories list
            updateTopCategoriesList(type, categoryData);
        } catch (error) {
            console.error(`Error updating ${type} category analysis chart:`, error);
        }
    }

    // Update Top Categories List
    function updateTopCategoriesList(type, categoryData) {
        const listId = `${type}-top-categories`;
        const listElement = document.getElementById(listId);

        if (!listElement) return;

        try {
            // Clear the list
            listElement.innerHTML = '';

            // Sort categories by amount
            const sortedCategories = Object.entries(categoryData)
                .filter(([_, amount]) => amount > 0)
                .sort(([_, a], [__, b]) => b - a)
                .slice(0, 5); // Top 5

            // Calculate total
            const total = Object.values(categoryData).reduce((sum, amount) => sum + amount, 0);

            // Create list items
            if (sortedCategories.length > 0) {
                sortedCategories.forEach(([category, amount]) => {
                    const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;

                    const item = document.createElement('li');
                    item.className = 'list-group-item d-flex justify-content-between align-items-center';

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = category;

                    const amountSpan = document.createElement('span');
                    amountSpan.className = type === 'income' ? 'text-success' : 'text-danger';
                    amountSpan.textContent = `${formatCurrency(amount)} (${percentage}%)`;

                    item.appendChild(nameSpan);
                    item.appendChild(amountSpan);

                    listElement.appendChild(item);
                });
            } else {
                // No data
                const item = document.createElement('li');
                item.className = 'list-group-item text-center';
                item.textContent = 'No hay datos para mostrar';
                listElement.appendChild(item);
            }
        } catch (error) {
            console.error(`Error updating ${type} top categories list:`, error);
        }
    }

    // Initialize Settings Section
    function initializeSettingsSection() {
        if (!settingsSection) return;

        try {
            // Get form elements
            const themeSelect = document.getElementById('theme');
            const enableAnimationsCheckbox = document.getElementById('enable-animations');
            const monthlySavingsGoalInput = document.getElementById('monthly-savings-goal');
            const budgetLimitInput = document.getElementById('budget-limit');
            const enableBudgetAlertsCheckbox = document.getElementById('enable-budget-alerts');
            const savePreferencesBtn = document.getElementById('save-preferences');
            const saveGoalsBtn = document.getElementById('save-goals');

            // Load current settings
            if (themeSelect) themeSelect.value = state.settings.theme || 'light';
            if (enableAnimationsCheckbox) enableAnimationsCheckbox.checked = state.settings.enableAnimations !== false;
            if (monthlySavingsGoalInput) monthlySavingsGoalInput.value = state.settings.monthlySavingsGoal || '';
            if (budgetLimitInput) budgetLimitInput.value = state.settings.budgetLimit || '';
            if (enableBudgetAlertsCheckbox) enableBudgetAlertsCheckbox.checked = state.settings.enableBudgetAlerts !== false;

            // Apply current theme
            applyTheme(state.settings.theme || 'light');

            // Save preferences button
            if (savePreferencesBtn) {
                savePreferencesBtn.addEventListener('click', function() {
                    if (themeSelect) state.settings.theme = themeSelect.value;
                    if (enableAnimationsCheckbox) state.settings.enableAnimations = enableAnimationsCheckbox.checked;

                    // Apply theme
                    applyTheme(state.settings.theme);

                    // Save settings
                    saveSettings();

                    alert('Preferencias guardadas correctamente.');
                });
            }

            // Save goals button
            if (saveGoalsBtn) {
                saveGoalsBtn.addEventListener('click', function() {
                    if (monthlySavingsGoalInput) state.settings.monthlySavingsGoal = parseFloat(monthlySavingsGoalInput.value) || 0;
                    if (budgetLimitInput) state.settings.budgetLimit = parseFloat(budgetLimitInput.value) || 0;
                    if (enableBudgetAlertsCheckbox) state.settings.enableBudgetAlerts = enableBudgetAlertsCheckbox.checked;

                    // Save settings
                    saveSettings();

                    alert('Metas financieras guardadas correctamente.');
                });
            }

            // Data management buttons
            const exportDataBtn = document.getElementById('export-data');
            const importDataInput = document.getElementById('import-file');
            const importDataBtn = document.getElementById('import-data');
            const deleteAllDataBtn = document.getElementById('delete-all-data');

            if (exportDataBtn) {
                exportDataBtn.addEventListener('click', function() {
                    exportData();
                });
            }

            if (importDataBtn && importDataInput) {
                importDataBtn.addEventListener('click', function() {
                    importDataInput.click();
                });

                importDataInput.addEventListener('change', function(e) {
                    if (e.target.files.length > 0) {
                        importData(e.target.files[0]);
                    }
                });
            }

            if (deleteAllDataBtn) {
                deleteAllDataBtn.addEventListener('click', function() {
                    // Solo una confirmación para borrar datos
                    if (confirm('¿Estás seguro de que deseas borrar todos los datos? Esta acción eliminará permanentemente todas tus transacciones y no se puede deshacer.')) {
                        // Clear all data
                        state.transactions = [];
                        state.categories = {
                            income: [...defaultCategories.income],
                            expense: [...defaultCategories.expense]
                        };
                        state.piggyBank = {
                            balance: 0,
                            history: []
                        };

                        // Save to local storage
                        saveData();

                        // Update UI
                        updateDashboard();

                        alert('Todos los datos han sido borrados.');
                    }
                });
            }
        } catch (error) {
            console.error("Error initializing settings section:", error);
        }
    }

    // Apply theme
    function applyTheme(theme) {
        try {
            const body = document.body;

            if (theme === 'dark') {
                body.classList.add('dark-mode');
            } else if (theme === 'light') {
                body.classList.remove('dark-mode');
            } else if (theme === 'system') {
                // Check system preference
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    body.classList.add('dark-mode');
                } else {
                    body.classList.remove('dark-mode');
                }
            }
        } catch (error) {
            console.error("Error applying theme:", error);
        }
    }

    // Export all data
    function exportData() {
        try {
            const data = {
                transactions: state.transactions,
                categories: state.categories,
                piggyBank: state.piggyBank,
                settings: state.settings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const link = document.createElement('a');

            const date = new Date().toISOString().split('T')[0];
            const filename = `FinanzApp_Backup_${date}.json`;

            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert('Datos exportados correctamente.');
        } catch (error) {
            console.error("Error exporting data:", error);
            alert('Ocurrió un error al exportar los datos.');
        }
    }

    // Import data from file
    function importData(file) {
        try {
            if (!file) return;

            const reader = new FileReader();

            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);

                    // Basic validation
                    if (!data.transactions || !data.categories) {
                        throw new Error('El archivo no contiene datos válidos.');
                    }

                    // Confirm import
                    if (confirm(`¿Deseas importar estos datos? Se reemplazarán tus datos actuales.\n\nEl archivo contiene:\n- ${data.transactions.length} transacciones\n- ${Object.keys(data.categories.income || {}).length} categorías de ingresos\n- ${Object.keys(data.categories.expense || {}).length} categorías de gastos`)) {

                        // Convert dates back to Date objects
                        data.transactions.forEach(t => {
                            if (typeof t.date === 'string') {
                                t.date = new Date(t.date);
                            }
                        });

                        if (data.piggyBank && data.piggyBank.history) {
                            data.piggyBank.history.forEach(entry => {
                                if (typeof entry.date === 'string') {
                                    entry.date = new Date(entry.date);
                                }
                            });
                        }

                        // Update state
                        state.transactions = data.transactions || [];
                        state.categories = data.categories || {
                            income: [...defaultCategories.income],
                            expense: [...defaultCategories.expense]
                        };

                        state.piggyBank = data.piggyBank || {
                            balance: 0,
                            history: []
                        };

                        state.settings = data.settings || {
                            theme: 'light',
                            enableAnimations: true,
                            monthlySavingsGoal: 0,
                            budgetLimit: 0,
                            enableBudgetAlerts: true
                        };

                        // Apply theme
                        applyTheme(state.settings.theme);

                        // Save imported data
                        saveData();
                        saveSettings();

                        // Update UI
                        updateDashboard();

                        alert('Datos importados correctamente.');
                    }
                } catch (error) {
                    console.error("Error parsing import file:", error);
                    alert('Error al importar datos: ' + error.message);
                }
            };

            reader.readAsText(file);
        } catch (error) {
            console.error("Error importing data:", error);
            alert('Ocurrió un error al importar los datos.');
        }
    }

    // Update transactions table
    function updateTransactionsTable() {
        if (!transactionsTable) return;

        try {
            // Get filtered transactions
            const filteredTransactions = getFilteredTransactions();

            // Sort by date (newest first)
            filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Clear table
            transactionsTable.innerHTML = '';

            // Show/hide empty state message
            if (noTransactionsMsg) {
                noTransactionsMsg.style.display = filteredTransactions.length === 0 ? 'block' : 'none';
            }

            // Add transactions to table
            filteredTransactions.forEach(transaction => {
                const row = document.createElement('tr');

                // Format date
                const date = new Date(transaction.date);
                const formattedDate = formatDateForInput(date);

                // Create table cells
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${transaction.description}</td>
                    <td>
                        <span class="badge ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}">
                            ${transaction.category}
                        </span>
                    </td>
                    <td class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                        ${formatCurrency(transaction.amount)}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-transaction" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-transaction" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;

                // Add event listeners
                const editBtn = row.querySelector('.edit-transaction');
                if (editBtn) {
                    editBtn.addEventListener('click', function() {
                        editTransaction(transaction.id);
                    });
                }

                const deleteBtn = row.querySelector('.delete-transaction');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        deleteTransaction(transaction.id);
                    });
                }

                transactionsTable.appendChild(row);
            });
        } catch (error) {
            console.error("Error updating transactions table:", error);
        }
    }

    // Edit transaction
    function editTransaction(id) {
        try {
            const transaction = state.transactions.find(t => t.id === id);
            if (!transaction || !transactionModal) return;

            state.editingTransactionId = id;

            // Set form values
            if (document.getElementById('transaction-modal-title')) {
                document.getElementById('transaction-modal-title').textContent = 'Editar Transacción';
            }

            if (document.getElementById('transaction-id')) {
                document.getElementById('transaction-id').value = transaction.id;
            }

            try {
                $("#transaction-date").datepicker('setDate', new Date(transaction.date));
            } catch (error) {
                if (document.getElementById('transaction-date')) {
                    document.getElementById('transaction-date').valueAsDate = new Date(transaction.date);
                }
            }

            if (transactionTypeSelect) {
                transactionTypeSelect.value = transaction.type;
                updateCategoryDropdown(transaction.type);
            }

            if (document.getElementById('transaction-description')) {
                document.getElementById('transaction-description').value = transaction.description;
            }

            if (document.getElementById('transaction-amount')) {
                document.getElementById('transaction-amount').value = transaction.amount;
            }

            // Set category after dropdown is updated
            setTimeout(() => {
                if (transactionCategorySelect) {
                    transactionCategorySelect.value = transaction.category;
                }
            }, 100);

            // Show modal
            transactionModal.show();
        } catch (error) {
            console.error("Error editing transaction:", error);
        }
    }

    // Delete transaction
    function deleteTransaction(id) {
        try {
            if (confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
                state.transactions = state.transactions.filter(t => t.id !== id);
                saveData();
                updateDashboard();
                updateTransactionsTable();
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
        }
    }

    // Get filtered transactions based on current period
    function getFilteredTransactions() {
        try {
            return state.transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                const isInDateRange = transactionDate >= state.currentPeriod.startDate && 
                                transactionDate <= state.currentPeriod.endDate;
                console.log('Filtrando transacción:', {
                    fecha: transactionDate,
                    tipo: transaction.type,
                    monto: transaction.amount,
                    enRango: isInDateRange
                });
                return isInDateRange;
            });
        } catch (error) {
            console.error("Error filtering transactions:", error);
            return [];
        }
    }

    // Format currency
    function formatCurrency(amount) {
        try {
            return '$' + amount.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } catch (error) {
            console.error("Error formatting currency:", error);
            return '$0.00';
        }
    }

    // Update dashboard
    function updateDashboard() {
        try {
            // Update metrics
            updateSummaryMetrics();

            // Update transactions table if on that section
            if (transactionsSection && transactionsSection.style.display !== 'none') {
                updateTransactionsTable();
            }

            // Update piggy bank
            updatePiggyBank();

            // Update date range display
            if (currentDateRange && state.currentPeriod.startDate && state.currentPeriod.endDate) {
                const startFormatted = formatDateForInput(state.currentPeriod.startDate);
                const endFormatted = formatDateForInput(state.currentPeriod.endDate);
                currentDateRange.textContent = `${startFormatted} - ${endFormatted}`;
            }
        } catch (error) {
            console.error("Error updating dashboard:", error);
        }
    }

    // Update summary metrics
    function updateSummaryMetrics() {
        try {
            console.log("Actualizando métricas de resumen...");

            // Get filtered transactions
            const filteredTransactions = getFilteredTransactions();

            // Calculate totals
            const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
            const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

            const income = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
            const expenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

            const balance = income - expenses;
            const savings = balance > 0 ? balance : 0;

            console.log("Ingresos:", income, "Gastos:", expenses, "Balance:", balance, "Ahorro:", savings);

            // Update UI elements
            if (incomeValue) incomeValue.textContent = formatCurrency(income);
            if (expensesValue) expensesValue.textContent = formatCurrency(expenses);
            if (balanceValue) balanceValue.textContent = formatCurrency(balance);
            if (savingsValue) savingsValue.textContent = formatCurrency(savings);

            // Calculate savings percent
            const savingsPercentValue = income > 0 ? Math.round((savings / income) * 100) : 0;
            if (savingsPercent) savingsPercent.textContent = savingsPercentValue + '%';

            // Update performance metric
            if (performanceValue) {
                const performancePercent = expenses > 0 ? Math.round((income / expenses - 1) * 100) : 0;
                performanceValue.textContent = (performancePercent > 0 ? '+' : '') + performancePercent + '%';
            }

            // Update trend indicator
            const trendIndicator = document.querySelector('.trend-indicator i');
            if (trendIndicator) {
                if (income > expenses) {
                    trendIndicator.className = 'fas fa-arrow-up text-success';
                } else if (income < expenses) {
                    trendIndicator.className = 'fas fa-arrow-down text-danger';
                } else {
                    trendIndicator.className = 'fas fa-equals text-warning';
                }
            }

            // Update progress bar - asegurarse de que actualizamos las barras correctas
            // Barra de progreso principal
            const progressBar = document.getElementById('main-progress-bar') || document.querySelector('.progress-bar');
            if (progressBar) {
                let progressPercent = 0;

                if (income > 0) {
                    progressPercent = Math.min(100, Math.max(0, (income - expenses) / income * 100));
                }

                console.log("Porcentaje de progreso:", progressPercent + "%");
                progressBar.style.width = `${progressPercent}%`;

                if (progressPercent > 0) {
                    progressBar.classList.remove('bg-danger');
                    progressBar.classList.add('bg-success');
                } else {
                    progressBar.classList.remove('bg-success');
                    progressBar.classList.add('bg-danger');
                }
            }

            // Actualizar gráficos pequeños en las tarjetas
            updateSmallCharts(incomeTransactions, expenseTransactions);

            // Actualizar secciones específicas si están visibles
            updateIncomeSection();
            updateExpensesSection();
        } catch (error) {
            console.error("Error updating summary metrics:", error);
        }
    }

    // Actualizar gráficos pequeños
    function updateSmallCharts(incomeTransactions, expenseTransactions) {
        try {
            // Actualizar gráfico de ingresos
            const incomeCanvas = document.getElementById('income-chart');
            if (incomeCanvas) {
                const context = incomeCanvas.getContext('2d');

                // Limpiar el canvas existente
                context.clearRect(0, 0, incomeCanvas.width, incomeCanvas.height);

                // Dibujar línea simple para ingresos si hay datos
                if (incomeTransactions && incomeTransactions.length > 0) {
                    context.beginPath();
                    context.strokeStyle = '#36b37e';
                    context.lineWidth = 2;

                    // Ordenar por fecha
                    const sortedIncomes = [...incomeTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));

                    // Valores para escalar
                    const minAmount = Math.min(...sortedIncomes.map(t => t.amount));
                    const maxAmount = Math.max(...sortedIncomes.map(t => t.amount));
                    const range = maxAmount - minAmount || 1;

                    // Dibujar línea
                    sortedIncomes.forEach((transaction, index) => {
                        const x = (index / (sortedIncomes.length - 1 || 1)) * incomeCanvas.width;
                        const y = incomeCanvas.height - ((transaction.amount - minAmount) / range) * incomeCanvas.height;

                        if (index === 0) {
                            context.moveTo(x, y);
                        } else {
                            context.lineTo(x, y);
                        }
                    });

                    context.stroke();
                }
            }

            // Actualizar gráfico de gastos
            const expenseCanvas = document.getElementById('expense-chart');
            if (expenseCanvas) {
                const context = expenseCanvas.getContext('2d');

                // Limpiar el canvas existente
                context.clearRect(0, 0, expenseCanvas.width, expenseCanvas.height);

                // Dibujar línea simple para gastos si hay datos
                if (expenseTransactions && expenseTransactions.length > 0) {
                    context.beginPath();
                    context.strokeStyle = '#ff5630';
                    context.lineWidth = 2;

                    // Ordenar por fecha
                    const sortedExpenses = [...expenseTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));

                    // Valores para escalar
                    const minAmount = Math.min(...sortedExpenses.map(t => t.amount));
                    const maxAmount = Math.max(...sortedExpenses.map(t => t.amount));
                    const range = maxAmount - minAmount || 1;

                    // Dibujar línea
                    sortedExpenses.forEach((transaction, index) => {
                        const x = (index / (sortedExpenses.length - 1 || 1)) * expenseCanvas.width;
                        const y = expenseCanvas.height - ((transaction.amount - minAmount) / range) * expenseCanvas.height;

                        if (index === 0) {
                            context.moveTo(x, y);
                        } else {
                            context.lineTo(x, y);
                        }
                    });

                    context.stroke();
                }
            }
        } catch (error) {
            console.error("Error updating small charts:", error);
        }
    }

    // Actualizar la sección de ingresos
    function updateIncomeSection() {
        try {
            // Forzar actualización incluso si la sección no está visible
            console.log("Actualizando sección de ingresos...");

            // Obtener transacciones filtradas
            const filteredTransactions = getFilteredTransactions();

            // Filtrar solo los ingresos
            const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');

            // Calcular el total de ingresos
            const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
            console.log("Total de ingresos calculado:", totalIncome);

            // Actualizar TODOS los elementos que muestran ingresos
            // 1. Actualizar las estadísticas de ingresos
            const incomeTotalAmountElement = document.getElementById('income-total-amount');
            if (incomeTotalAmountElement) {
                incomeTotalAmountElement.textContent = formatCurrency(totalIncome);
                console.log("Actualizado income-total-amount:", formatCurrency(totalIncome));
            }

            // Actualizar promedio y máximo
            if (incomeTransactions.length > 0) {
                const avgIncome = totalIncome / incomeTransactions.length;
                const maxIncome = Math.max(...incomeTransactions.map(t => t.amount));

                const incomeAvgElement = document.getElementById('income-avg-amount');
                const incomeMaxElement = document.getElementById('income-max-amount');

                if (incomeAvgElement) {
                    incomeAvgElement.textContent = formatCurrency(avgIncome);
                }

                if (incomeMaxElement) {
                    incomeMaxElement.textContent = formatCurrency(maxIncome);
                }
            }

            // 2. Actualizar la tabla de ingresos si existe
            const incomeTable = document.getElementById('income-table');
            if (incomeTable) {
                const tbody = incomeTable.querySelector('tbody');
                if (tbody) {
                    tbody.innerHTML = '';

                    if (incomeTransactions.length === 0) {
                        const row = document.createElement('tr');
                        row.innerHTML = '<td colspan="5" class="text-center">No hay ingresos en este período</td>';
                        tbody.appendChild(row);
                    } else {
                        // Ordenar por fecha (más reciente primero)
                        incomeTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

                        incomeTransactions.forEach(transaction => {
                            const row = document.createElement('tr');

                            // Formatear fecha
                            const date = formatDateForInput(new Date(transaction.date));

                            row.innerHTML = `
                                <td>${date}</td>
                                <td>${transaction.description}</td>
                                <td>${transaction.category}</td>
                                <td class="text-end">${formatCurrency(transaction.amount)}</td>
                                <td class="text-center">
                                    <button class="btn btn-sm btn-outline-primary edit-income" data-id="${transaction.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger delete-income" data-id="${transaction.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            `;

                            tbody.appendChild(row);
                        });

                        // Agregar event listeners para editar y eliminar
                        const editButtons = tbody.querySelectorAll('.edit-income');
                        const deleteButtons = tbody.querySelectorAll('.delete-income');

                        editButtons.forEach(btn => {
                            btn.addEventListener('click', function() {
                                const id = this.getAttribute('data-id');
                                editTransaction(id);
                            });
                        });

                        deleteButtons.forEach(btn => {
                            btn.addEventListener('click', function() {
                                const id = this.getAttribute('data-id');
                                deleteTransaction(id);
                            });
                        });
                    }
                }
            }

            // Actualizar el gráfico de ingresos por categoría si existe
            const incomeByCategory = {};
            incomeTransactions.forEach(t => {
                if (!incomeByCategory[t.category]) {
                    incomeByCategory[t.category] = 0;
                }
                incomeByCategory[t.category] += t.amount;
            });

            // Actualizar la lista de ingresos por categoría
            const incomeCategoriesList = document.getElementById('income-categories-summary');
            if (incomeCategoriesList) {
                incomeCategoriesList.innerHTML = '';

                // Ordenar categorías por monto
                const sortedCategories = Object.entries(incomeByCategory)
                    .sort(([_, a], [__, b]) => b - a);

                sortedCategories.forEach(([category, amount]) => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    li.innerHTML = `
                        <span>${category}</span>
                        <span class="badge bg-success">${formatCurrency(amount)}</span>
                    `;
                    incomeCategoriesList.appendChild(li);
                });

                if (sortedCategories.length === 0) {
                    const li = document.createElement('li');
                    li.className = 'list-group-item text-center';
                    li.textContent = 'No hay ingresos en este período';
                    incomeCategoriesList.appendChild(li);
                }
            }
        } catch (error) {
            console.error("Error updating income section:", error);
        }
    }

    // Actualizar la sección de gastos
    function updateExpensesSection() {
        if (!expensesSection || expensesSection.style.display === 'none') return;

        try {
            // Obtener transacciones filtradas
            const filteredTransactions = getFilteredTransactions();

            // Filtrar solo los gastos
            const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

            // Calcular el total de gastos
            const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

            // Actualizar la vista de gastos
            const expensesTotalElement = document.getElementById('expenses-total');
            if (expensesTotalElement) {
                expensesTotalElement.textContent = formatCurrency(totalExpenses);
            }

            // Actualizar la tabla de gastos si existe
            const expensesTableBody = document.getElementById('expenses-table-body');
            if (expensesTableBody) {
                expensesTableBody.innerHTML = '';

                if (expenseTransactions.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="4" class="text-center">No hay gastos en este período</td>';
                    expensesTableBody.appendChild(row);
                } else {
                    // Ordenar por fecha (más reciente primero)
                    expenseTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

                    expenseTransactions.forEach(transaction => {
                        const row = document.createElement('tr');

                        // Formatear fecha
                        const date = formatDateForInput(new Date(transaction.date));

                        row.innerHTML = `
                            <td>${date}</td>
                            <td>${transaction.description}</td>
                            <td>${transaction.category}</td>
                            <td class="text-end">${formatCurrency(transaction.amount)}</td>
                        `;

                        expensesTableBody.appendChild(row);
                    });
                }
            }

            // Actualizar el gráfico de gastos por categoría si existe
            const expensesByCategory = {};
            expenseTransactions.forEach(t => {
                if (!expensesByCategory[t.category]) {
                    expensesByCategory[t.category] = 0;
                }
                expensesByCategory[t.category] += t.amount;
            });

            // Actualizar la lista de gastos por categoría
            const expensesCategoriesList = document.getElementById('expenses-categories-summary');
            if (expensesCategoriesList) {
                expensesCategoriesList.innerHTML = '';

                // Ordenar categorías por monto
                const sortedCategories = Object.entries(expensesByCategory)
                    .sort(([_, a], [__, b]) => b - a);

                sortedCategories.forEach(([category, amount]) => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    li.innerHTML = `
                        <span>${category}</span>
                        <span class="badge bg-danger">${formatCurrency(amount)}</span>
                    `;
                    expensesCategoriesList.appendChild(li);
                });

                if (sortedCategories.length === 0) {
                    const li = document.createElement('li');
                    li.className = 'list-group-item text-center';
                    li.textContent = 'No hay gastos en este período';
                    expensesCategoriesList.appendChild(li);
                }
            }
        } catch (error) {
            console.error("Error updating expenses section:", error);
        }
    }

    // Save data to local storage
    function saveData() {
        try {
            localStorage.setItem('finanzas_transactions', JSON.stringify(state.transactions));
            localStorage.setItem('finanzas_categories', JSON.stringify(state.categories));
            localStorage.setItem('finanzas_piggy_bank', JSON.stringify(state.piggyBank));
        } catch (error) {
            console.error("Error saving data to localStorage:", error);
        }
    }

    // Save settings to local storage
    function saveSettings() {
        try {
            localStorage.setItem('finanzas_settings', JSON.stringify(state.settings));
        } catch (error) {
            console.error("Error saving settings to localStorage:", error);
        }
    }

    // Load data from local storage
    function loadData() {
        try {
            // Load transactions
            const savedTransactions = localStorage.getItem('finanzas_transactions');
            if (savedTransactions) {
                state.transactions = JSON.parse(savedTransactions);

                // Convert date strings to Date objects
                state.transactions.forEach(transaction => {
                    if (typeof transaction.date === 'string') {
                        transaction.date = new Date(transaction.date);
                    }
                });
            }

            // Load categories
            const savedCategories = localStorage.getItem('finanzas_categories');
            if (savedCategories) {
                state.categories = JSON.parse(savedCategories);
            } else {
                // Use default categories
                state.categories = JSON.parse(JSON.stringify(defaultCategories));
            }

            // Load piggy bank
            const savedPiggyBank = localStorage.getItem('finanzas_piggy_bank');
            if (savedPiggyBank) {
                state.piggyBank = JSON.parse(savedPiggyBank);

                // Convert dates in history
                if (state.piggyBank.history) {
                    state.piggyBank.history.forEach(entry => {
                        if (typeof entry.date === 'string') {
                            entry.date = new Date(entry.date);
                        }
                    });
                }
            }

            // Load settings
            const savedSettings = localStorage.getItem('finanzas_settings');
            if (savedSettings) {
                state.settings = JSON.parse(savedSettings);
            }
        } catch (error) {
            console.error("Error loading data from localStorage:", error);

            // Reset to defaults if there's an error
            state.transactions = [];
            state.categories = JSON.parse(JSON.stringify(defaultCategories));
            state.piggyBank = {
                balance: 0,
                history: []
            };
            state.settings = {
                theme: 'light',
                enableAnimations: true,
                monthlySavingsGoal: 0,
                budgetLimit: 0,
                enableBudgetAlerts: true
            };
        }
    }

    // Generate Trends Analysis, Cashflow and Savings Analysis Reports
    // These functions would follow the same pattern as the ones above
    // But are omitted for brevity

    // Initialize mobile sidebar
    function initializeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarClose = document.getElementById('sidebarClose');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                if (sidebar) {
                    sidebar.classList.add('active');
                }
            });
        }

        if (sidebarClose) {
            sidebarClose.addEventListener('click', function() {
                if (sidebar) {
                    sidebar.classList.remove('active');
                }
            });
        }

        // Cerrar el sidebar al hacer clic en un link (para móviles)
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 768 && sidebar) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }

    // Initialize
    function initialize() {
        console.log('Initializing FinanzApp...');

        // Load saved data
        loadData();

        // Initialize mobile sidebar
        initializeMobileSidebar();

        // Setup navigation and sections
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Navigation clicked:', this.id);

                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));

                // Add active class to clicked link
                this.classList.add('active');

                // Show the corresponding section
                const linkId = this.id;
                if (linkId === 'dashboard-link') {
                    showSection('dashboard-section');
                    updateDashboard();
                } else if (linkId === 'transactions-link') {
                    showSection('transactions-section');
                    updateTransactionsTable();
                } else if (linkId === 'income-link') {
                    showSection('income-section');
                    // Implementar la actualización de la sección de ingresos
                } else if (linkId === 'expenses-link') {
                    showSection('expenses-section');
                    // Implementar la actualización de la sección de gastos
                } else if (linkId === 'categories-link') {
                    showSection('categories-section');
                    updateCategoryLists();
                } else if (linkId === 'reports-link') {
                    showSection('reports-section');
                    initializeReportsSection();
                } else if (linkId === 'settings-link') {
                    showSection('settings-section');
                    initializeSettingsSection();
                }
            });
        });

        // Initialize components
        initializeDateFilters();
        setupTransactionModal();
        setupCategoryManagement();
        setupPiggyBank();

        // Apply theme
        applyTheme(state.settings.theme || 'light');

        // Initial update
        updateDashboard();

        console.log('FinanzApp initialization complete.');
    }

    // Start the application
    initialize();
});