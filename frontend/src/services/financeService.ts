import { 
  Transaction, 
  TransactionInput, 
  Category,
  FinancialReport 
} from "@/types/finance";
import { indexedDBService } from "./indexedDB";
import { toast } from "react-hot-toast";
import API from "./api";

// Store names in IndexedDB
const TRANSACTIONS_STORE = "transactions";
const CATEGORIES_STORE = "categories";

/**
 * Generate a unique ID for transactions
 */
const generateId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Helper function to check internet connection
 */
const isOnline = (): boolean => navigator.onLine;

/**
 * Initialize the finance stores in IndexedDB if needed
 */
export const initializeFinanceStores = async (): Promise<void> => {
  try {
    // First ensure the database is initialized
    await indexedDBService.initDB();
    
    // Add default categories if none exist
    const categories = await getAllCategories();
    if (categories.length === 0) {
      // Income categories
      await createCategory({
        _id: generateId(),
        name: "Appointment",
        type: "income",
        description: "Income from patient appointments",
        color: "#10B981" // Green
      });
      
      await createCategory({
        _id: generateId(),
        name: "Procedure",
        type: "income",
        description: "Income from medical procedures",
        color: "#3B82F6" // Blue
      });
      
      await createCategory({
        _id: generateId(),
        name: "Other Income",
        type: "income",
        description: "Miscellaneous income",
        color: "#8B5CF6" // Purple
      });
      
      // Expense categories
      await createCategory({
        _id: generateId(),
        name: "Supplies",
        type: "expense",
        description: "Medical supplies and equipment",
        color: "#F59E0B" // Amber
      });
      
      await createCategory({
        _id: generateId(),
        name: "Salary",
        type: "expense",
        description: "Staff and employee salaries",
        color: "#EF4444" // Red
      });
      
      await createCategory({
        _id: generateId(),
        name: "Rent",
        type: "expense",
        description: "Clinic or office rent",
        color: "#EC4899" // Pink
      });
      
      await createCategory({
        _id: generateId(),
        name: "Utilities",
        type: "expense",
        description: "Water, electricity, internet, etc.",
        color: "#6366F1" // Indigo
      });
    }
    
    console.log("Finance stores initialized successfully");
  } catch (error) {
    console.error("Error initializing finance stores:", error);
    throw error;
  }
};

/**
 * Get all transactions from the database
 * Optionally filter by date range and transaction type
 */
export const getAllTransactions = async (params?: {
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense";
}): Promise<Transaction[]> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Get all transactions from IndexedDB
    let transactions: Transaction[] = await indexedDBService.getAllFromStore(TRANSACTIONS_STORE);
    
    // Filter transactions that are marked for deletion
    transactions = transactions.filter((transaction) => !transaction.pendingDelete);
    
    // Apply filters if provided
    if (params) {
      if (params.type) {
        transactions = transactions.filter((transaction) => transaction.type === params.type);
      }
      
      if (params.startDate || params.endDate) {
        transactions = transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          const start = params.startDate ? new Date(params.startDate) : new Date(0);
          const end = params.endDate ? new Date(params.endDate) : new Date(8640000000000000);
          
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          
          return transactionDate >= start && transactionDate <= end;
        });
      }
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return transactions;
  } catch (error) {
    console.error("Error getting transactions:", error);
    toast.error("Failed to load transactions");
    return [];
  }
};

/**
 * Create a new transaction
 */
export const createTransaction = async (
  transactionData: TransactionInput
): Promise<Transaction> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Generate a new ID for the transaction
    const _id = generateId();
    
    // Create transaction object
    const transaction: Transaction = {
      ...transactionData,
      _id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pendingSync: true,
      pendingDelete: false
    };
    
    // Save to IndexedDB
    await indexedDBService.saveToStore(TRANSACTIONS_STORE, transaction);
    
    // Attempt to sync with server if online
    if (isOnline()) {
      try {
        // Extract fields needed for API
        const { pendingSync, pendingDelete, ...apiData } = transaction;
        
        // Send to server
        const response = await API.post("/finance/transactions", apiData);
        const serverTransaction = response.data;
        
        // Update local record with server ID
        await indexedDBService.deleteFromStore(TRANSACTIONS_STORE, _id);
        await indexedDBService.saveToStore(TRANSACTIONS_STORE, {
          ...serverTransaction,
          pendingSync: false,
          pendingDelete: false
        });
        
        toast.success("Transaction created and synced successfully");
        return serverTransaction;
      } catch (syncError) {
        console.error("Error syncing transaction with server:", syncError);
        // Continue with local transaction if server sync fails
      }
    }
    
    toast.success("Transaction created successfully");
    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    toast.error("Failed to create transaction");
    throw error;
  }
};

/**
 * Update an existing transaction
 */
export const updateTransaction = async (
  id: string,
  transactionData: Partial<Transaction>
): Promise<Transaction> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Get existing transaction
    const existingTransaction = await indexedDBService.getFromStore(TRANSACTIONS_STORE, id);
    if (!existingTransaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }
    
    // Create updated transaction object
    const updatedTransaction: Transaction = {
      ...existingTransaction,
      ...transactionData,
      updatedAt: new Date().toISOString(),
      pendingSync: true
    };
    
    // Save to IndexedDB
    await indexedDBService.saveToStore(TRANSACTIONS_STORE, updatedTransaction);
    
    // Attempt to sync with server if online
    if (isOnline()) {
      try {
        // Extract fields needed for API
        const { pendingSync, pendingDelete, ...apiData } = updatedTransaction;
        
        // Send to server
        const response = await API.put(`/finance/transactions/${id}`, apiData);
        const serverTransaction = response.data;
        
        // Update local record
        await indexedDBService.saveToStore(TRANSACTIONS_STORE, {
          ...serverTransaction,
          pendingSync: false,
          pendingDelete: false
        });
        
        toast.success("Transaction updated and synced successfully");
        return serverTransaction;
      } catch (syncError) {
        console.error("Error syncing updated transaction with server:", syncError);
        // Continue with local update if server sync fails
      }
    }
    
    toast.success("Transaction updated successfully");
    return updatedTransaction;
  } catch (error) {
    console.error("Error updating transaction:", error);
    toast.error("Failed to update transaction");
    throw error;
  }
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // If online, try to delete from server
    if (isOnline()) {
      try {
        // Only attempt to delete from server if it's not a local ID
        if (!id.startsWith("local_")) {
          await API.delete(`/finance/transactions/${id}`);
        }
        
        // Delete from IndexedDB immediately
        await indexedDBService.deleteFromStore(TRANSACTIONS_STORE, id);
        toast.success("Transaction deleted successfully");
        return;
      } catch (syncError) {
        console.error("Error deleting transaction from server:", syncError);
        // Mark as pending delete if server deletion fails
        const transaction = await indexedDBService.getFromStore(TRANSACTIONS_STORE, id);
        if (transaction) {
          await indexedDBService.saveToStore(TRANSACTIONS_STORE, {
            ...transaction,
            pendingDelete: true,
            pendingSync: true
          });
        }
      }
    } else {
      // If offline, mark as pending delete
      const transaction = await indexedDBService.getFromStore(TRANSACTIONS_STORE, id);
      if (transaction) {
        await indexedDBService.saveToStore(TRANSACTIONS_STORE, {
          ...transaction,
          pendingDelete: true,
          pendingSync: true
        });
      }
    }
    
    toast.success("Transaction deleted successfully");
  } catch (error) {
    console.error("Error deleting transaction:", error);
    toast.error("Failed to delete transaction");
    throw error;
  }
};

/**
 * Get all categories from the database
 */
export const getAllCategories = async (type?: "income" | "expense"): Promise<Category[]> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Get all categories from IndexedDB
    let categories: Category[] = await indexedDBService.getAllFromStore(CATEGORIES_STORE);
    
    // Filter by type if provided
    if (type) {
      categories = categories.filter((category) => category.type === type);
    }
    
    // Sort by name
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    return categories;
  } catch (error) {
    console.error("Error getting categories:", error);
    toast.error("Failed to load categories");
    return [];
  }
};

/**
 * Create a new category
 */
export const createCategory = async (categoryData: Category): Promise<Category> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Save to IndexedDB
    await indexedDBService.saveToStore(CATEGORIES_STORE, categoryData);
    
    toast.success("Category created successfully");
    return categoryData;
  } catch (error) {
    console.error("Error creating category:", error);
    toast.error("Failed to create category");
    throw error;
  }
};

/**
 * Update an existing category
 */
export const updateCategory = async (
  id: string,
  categoryData: Partial<Category>
): Promise<Category> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Get existing category
    const existingCategory = await indexedDBService.getFromStore(CATEGORIES_STORE, id);
    if (!existingCategory) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    // Create updated category object
    const updatedCategory: Category = {
      ...existingCategory,
      ...categoryData
    };
    
    // Save to IndexedDB
    await indexedDBService.saveToStore(CATEGORIES_STORE, updatedCategory);
    
    toast.success("Category updated successfully");
    return updatedCategory;
  } catch (error) {
    console.error("Error updating category:", error);
    toast.error("Failed to update category");
    throw error;
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Check if category is used in any transactions
    const transactions = await getAllTransactions();
    const categoryInUse = transactions.some(
      (transaction) => 
        (typeof transaction.category === 'string' && transaction.category === id) ||
        (typeof transaction.category !== 'string' && transaction.category._id === id)
    );
    
    if (categoryInUse) {
      toast.error("Cannot delete category that is in use");
      throw new Error("Category in use");
    }
    
    // Delete from IndexedDB
    await indexedDBService.deleteFromStore(CATEGORIES_STORE, id);
    
    toast.success("Category deleted successfully");
  } catch (error) {
    console.error("Error deleting category:", error);
    toast.error("Failed to delete category");
    throw error;
  }
};

/**
 * Generate a financial report
 */
export const generateFinancialReport = async (
  startDate: string, 
  endDate: string, 
  period: "day" | "week" | "month" | "year" | "custom" = "custom"
): Promise<FinancialReport> => {
  try {
    // Get transactions within date range
    const transactions = await getAllTransactions({
      startDate,
      endDate
    });
    
    // Calculate totals
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netProfit = totalIncome - totalExpense;
    
    // Group by categories
    const incomeByCategory = groupTransactionsByCategory(
      transactions.filter((t) => t.type === "income")
    );
    
    const expenseByCategory = groupTransactionsByCategory(
      transactions.filter((t) => t.type === "expense")
    );
    
    // Group by days
    const dailyTotals = getDailyTotals(transactions, startDate, endDate);
    
    // Build report
    const report: FinancialReport = {
      period,
      startDate,
      endDate,
      totalIncome,
      totalExpense,
      netProfit,
      incomeByCategory,
      expenseByCategory,
      dailyTotals
    };
    
    return report;
  } catch (error) {
    console.error("Error generating financial report:", error);
    toast.error("Failed to generate report");
    throw error;
  }
};

/**
 * Helper function to group transactions by category
 */
const groupTransactionsByCategory = (transactions: Transaction[]) => {
  const categoryMap = new Map<string, number>();
  
  transactions.forEach((transaction) => {
    const categoryId = typeof transaction.category === 'string' 
      ? transaction.category 
      : transaction.category._id;
    
    const categoryName = typeof transaction.category === 'string'
      ? transaction.category
      : transaction.category.name;
      
    const key = categoryId || categoryName || 'Uncategorized';
    
    const currentAmount = categoryMap.get(key) || 0;
    categoryMap.set(key, currentAmount + transaction.amount);
  });
  
  return Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount
  }));
};

/**
 * Helper function to generate daily totals
 */
const getDailyTotals = (
  transactions: Transaction[], 
  startDate: string, 
  endDate: string
) => {
  // Create a map of dates within the range
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  const dateMap = new Map<string, { income: number; expense: number }>();
  
  // Initialize all dates in range
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dateMap.set(dateStr, { income: 0, expense: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Populate with actual data
  transactions.forEach((transaction) => {
    const dateStr = transaction.date.split('T')[0];
    if (dateMap.has(dateStr)) {
      const current = dateMap.get(dateStr)!;
      if (transaction.type === 'income') {
        current.income += transaction.amount;
      } else {
        current.expense += transaction.amount;
      }
      dateMap.set(dateStr, current);
    }
  });
  
  // Convert map to array
  return Array.from(dateMap.entries()).map(([date, values]) => ({
    date,
    income: values.income,
    expense: values.expense
  }));
};

/**
 * Record a salary withdrawal for an employee
 * This is used when an employee withdraws part of their salary
 */
export const recordSalaryWithdrawal = async (
  employeeId: string,
  amount: number,
  notes: string = ""
): Promise<Transaction> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Create withdrawal transaction
    const transaction: TransactionInput = {
      date: new Date().toISOString().split('T')[0],
      amount: amount,
      type: "expense",
      category: "Salary",
      description: `Salary withdrawal${notes ? ` - ${notes}` : ""}`,
      paymentMethod: "cash",
      status: "completed",
      employeeId
    };
    
    // Create the transaction
    const result = await createTransaction(transaction);
    
    // Update employee's remaining salary
    await updateEmployeeSalaryBalance(employeeId);
    
    return result;
  } catch (error) {
    console.error("Error recording salary withdrawal:", error);
    toast.error("Failed to record salary withdrawal");
    throw error;
  }
};

/**
 * Add a salary deduction for an employee
 * Used for absences, late arrivals, or other penalties
 */
export const addDeduction = async (
  employeeId: string,
  amount: number,
  reason: string
): Promise<void> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Get employee
    const employee = await indexedDBService.getFromStore("employees", employeeId);
    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }
    
    // Initialize deductions array if it doesn't exist
    if (!employee.deductions) {
      employee.deductions = [];
    }
    
    // Add new deduction
    employee.deductions.push({
      amount,
      reason,
      date: new Date().toISOString().split('T')[0]
    });
    
    // Save updated employee
    await indexedDBService.saveToStore("employees", employee);
    
    // Update employee's remaining salary
    await updateEmployeeSalaryBalance(employeeId);
    
    toast.success("Deduction added successfully");
  } catch (error) {
    console.error("Error adding deduction:", error);
    toast.error("Failed to add deduction");
    throw error;
  }
};

/**
 * Add a salary reward/bonus for an employee
 */
export const addReward = async (
  employeeId: string,
  amount: number,
  reason: string
): Promise<void> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Get employee
    const employee = await indexedDBService.getFromStore("employees", employeeId);
    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }
    
    // Initialize rewards array if it doesn't exist
    if (!employee.rewards) {
      employee.rewards = [];
    }
    
    // Add new reward
    employee.rewards.push({
      amount,
      reason,
      date: new Date().toISOString().split('T')[0]
    });
    
    // Save updated employee
    await indexedDBService.saveToStore("employees", employee);
    
    // Update employee's remaining salary
    await updateEmployeeSalaryBalance(employeeId);
    
    toast.success("Reward added successfully");
  } catch (error) {
    console.error("Error adding reward:", error);
    toast.error("Failed to add reward");
    throw error;
  }
};

/**
 * Calculate and update an employee's remaining salary
 */
export const updateEmployeeSalaryBalance = async (employeeId: string): Promise<number> => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Get employee
    const employee = await indexedDBService.getFromStore("employees", employeeId);
    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }
    
    // Get current month's start and end dates
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get salary transactions for this month
    const transactions = await getAllTransactions({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      type: "expense"
    });
    
    // Filter transactions related to this employee's salary
    const salaryTransactions = transactions.filter(transaction => 
      transaction.employeeId === employeeId && 
      (typeof transaction.category === 'string' 
        ? transaction.category === "Salary" 
        : transaction.category.name === "Salary")
    );
    
    // Calculate total withdrawals
    const totalWithdrawals = salaryTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    // Calculate total deductions
    const totalDeductions = employee.deductions 
      ? employee.deductions.reduce((sum, deduction) => {
          // Only count deductions from current month
          const deductionDate = new Date(deduction.date);
          if (deductionDate >= startOfMonth && deductionDate <= endOfMonth) {
            return sum + deduction.amount;
          }
          return sum;
        }, 0)
      : 0;
    
    // Calculate total rewards
    const totalRewards = employee.rewards
      ? employee.rewards.reduce((sum, reward) => {
          // Only count rewards from current month
          const rewardDate = new Date(reward.date);
          if (rewardDate >= startOfMonth && rewardDate <= endOfMonth) {
            return sum + reward.amount;
          }
          return sum;
        }, 0)
      : 0;
    
    // Calculate remaining salary
    const baseSalary = employee.baseSalary || 0;
    const remainingSalary = baseSalary - totalWithdrawals - totalDeductions + totalRewards;
    
    // Update employee's remaining salary
    employee.remainingSalary = remainingSalary > 0 ? remainingSalary : 0;
    
    // Save updated employee
    await indexedDBService.saveToStore("employees", employee);
    
    return remainingSalary;
  } catch (error) {
    console.error("Error calculating remaining salary:", error);
    throw error;
  }
};

/**
 * Get an employee's salary summary for current month
 */
export const getEmployeeSalarySummary = async (employeeId: string) => {
  try {
    // Initialize database if needed
    await indexedDBService.initDB();
    
    // Get employee
    const employee = await indexedDBService.getFromStore("employees", employeeId);
    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }
    
    // Get current month's start and end dates
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get salary transactions for this month
    const transactions = await getAllTransactions({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      type: "expense"
    });
    
    // Filter transactions related to this employee's salary
    const salaryTransactions = transactions.filter(transaction => 
      transaction.employeeId === employeeId && 
      (typeof transaction.category === 'string' 
        ? transaction.category === "Salary" 
        : transaction.category.name === "Salary")
    );
    
    // Get deductions for current month
    const currentDeductions = employee.deductions 
      ? employee.deductions.filter(deduction => {
          const deductionDate = new Date(deduction.date);
          return deductionDate >= startOfMonth && deductionDate <= endOfMonth;
        })
      : [];
    
    // Get rewards for current month
    const currentRewards = employee.rewards
      ? employee.rewards.filter(reward => {
          const rewardDate = new Date(reward.date);
          return rewardDate >= startOfMonth && rewardDate <= endOfMonth;
        })
      : [];
    
    return {
      baseSalary: employee.baseSalary || 0,
      remainingSalary: employee.remainingSalary || 0,
      withdrawals: salaryTransactions,
      deductions: currentDeductions,
      rewards: currentRewards
    };
  } catch (error) {
    console.error("Error getting salary summary:", error);
    throw error;
  }
}; 