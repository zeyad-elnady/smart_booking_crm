/**
 * Types related to financial data and transactions
 */

/**
 * Transaction Types
 */
export type TransactionType = 'income' | 'expense';

/**
 * Payment Methods
 */
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'insurance' | 'other';

/**
 * Transaction Status
 */
export type TransactionStatus = 'completed' | 'pending' | 'cancelled';

/**
 * Category for transaction classification
 */
export interface Category {
  _id: string;
  name: string;
  type: TransactionType;
  description?: string;
  color?: string;
}

/**
 * Transaction interface representing a financial transaction
 */
export interface Transaction {
  _id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string | Category;
  description: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  reference?: string;
  appointmentId?: string;
  customerId?: string;
  employeeId?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  pendingSync?: boolean;
  pendingDelete?: boolean;
}

/**
 * Financial Report interface for summary data
 */
export interface FinancialReport {
  period: 'day' | 'week' | 'month' | 'year' | 'custom';
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  incomeByCategory: {
    category: string;
    amount: number;
  }[];
  expenseByCategory: {
    category: string;
    amount: number;
  }[];
  dailyTotals: {
    date: string;
    income: number;
    expense: number;
  }[];
}

/**
 * Input data for creating a new transaction
 */
export type TransactionInput = Omit<Transaction, '_id' | 'createdAt' | 'updatedAt' | 'pendingSync' | 'pendingDelete'>; 