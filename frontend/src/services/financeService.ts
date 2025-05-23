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