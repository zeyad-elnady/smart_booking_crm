"use client";

import { useState, useEffect } from "react";
import { 
  BanknotesIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  CurrencyDollarIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllEmployees } from "@/services/employeeService";
import { getAllTransactions, createTransaction } from "@/services/financeService";
import { Employee } from "@/types/employee";
import { Transaction } from "@/types/finance";
import { toast } from "react-hot-toast";

export default function FinancePage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [salaryAmount, setSalaryAmount] = useState<string>("");
  const [salaryNotes, setSalaryNotes] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Load employees
        const employeeData = await getAllEmployees();
        setEmployees(employeeData);
        
        // Load transactions for the last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const transactionData = await getAllTransactions({
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        });
        setTransactions(transactionData);
      } catch (error) {
        console.error("Error loading finance data:", error);
        toast.error("Failed to load financial data");
      } finally {
        setLoading(false);
      }
    };
    
    if (mounted) {
      loadData();
    }
  }, [mounted, refreshTrigger]);

  // Mock financial data
  const financialStats = [
    { 
      id: 1, 
      title: "Total Revenue", 
      value: "EGP 12,450", 
      change: "+8.2%", 
      trend: "up", 
      icon: CurrencyDollarIcon 
    },
    { 
      id: 2, 
      title: "Monthly Income", 
      value: "EGP 3,650", 
      change: "+5.4%", 
      trend: "up", 
      icon: ArrowTrendingUpIcon 
    },
    { 
      id: 3, 
      title: "Total Expenses", 
      value: "EGP 2,890", 
      change: "-2.7%", 
      trend: "down", 
      icon: ArrowTrendingDownIcon 
    },
    { 
      id: 4, 
      title: "Net Profit", 
      value: "EGP 9,560", 
      change: "+12.3%", 
      trend: "up", 
      icon: BanknotesIcon 
    },
  ];

  // Mock recent transactions
  const recentTransactions = [
    { id: 1, date: "2023-07-15", type: "income", description: "Payment for dental checkup", amount: "EGP 850" },
    { id: 2, date: "2023-07-14", type: "expense", description: "Medical supplies", amount: "EGP 450" },
    { id: 3, date: "2023-07-13", type: "income", description: "Consultation fee", amount: "EGP 950" },
    { id: 4, date: "2023-07-12", type: "expense", description: "Office rent", amount: "EGP 1,200" },
    { id: 5, date: "2023-07-10", type: "income", description: "X-ray service", amount: "EGP 650" },
  ];

  // Filter transactions to get only salary payments
  const salaryTransactions = transactions.filter(transaction => 
    transaction.type === "expense" && 
    (typeof transaction.category === 'string' 
      ? transaction.category === "Salary" 
      : transaction.category.name === "Salary")
  );

  // Handle salary payment
  const handleSalaryPayment = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }
    
    if (!salaryAmount || isNaN(parseFloat(salaryAmount)) || parseFloat(salaryAmount) <= 0) {
      toast.error("Please enter a valid salary amount");
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      const employee = employees.find(emp => emp._id === selectedEmployee);
      
      const salaryTransaction = {
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(salaryAmount),
        type: "expense" as const,
        category: "Salary",
        description: `Salary payment for ${employee?.firstName} ${employee?.lastName}${salaryNotes ? ` - ${salaryNotes}` : ''}`,
        paymentMethod: "bank_transfer" as const,
        status: "completed" as const,
        employeeId: selectedEmployee
      };
      
      await createTransaction(salaryTransaction);
      toast.success("Salary payment recorded successfully");
      
      // Reset form and refresh data
      setSelectedEmployee("");
      setSalaryAmount("");
      setSalaryNotes("");
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error processing salary payment:", error);
      toast.error("Failed to record salary payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Financial Management</h1>
        <div className="flex gap-2">
          <button className="btn bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center">
            <BanknotesIcon className="h-5 w-5 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialStats.map((stat) => (
          <div 
            key={stat.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400 text-sm">{stat.title}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                stat.trend === "up" 
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                  : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              }`}>
                {stat.change}
                {stat.trend === "up" ? 
                  <ArrowTrendingUpIcon className="ml-1 h-3 w-3" /> : 
                  <ArrowTrendingDownIcon className="ml-1 h-3 w-3" />
                }
              </span>
            </div>
            <div className="mt-2 flex items-center">
              <stat.icon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="text-2xl font-semibold">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs for different financial views */}
      <div className="mt-8">
        <Tabs defaultValue="transactions" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
            <TabsTrigger value="salaries">Salaries</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          {/* Recent Transactions Tab */}
          <TabsContent value="transactions" className="mt-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{transaction.date}</td>
                      <td className="px-6 py-4">{transaction.description}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          transaction.type === "income"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                        }`}>
                          {transaction.type === "income" ? "Income" : "Expense"}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right ${
                        transaction.type === "income" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}{transaction.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          {/* Salaries Tab */}
          <TabsContent value="salaries" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold">Salary Payment History</h2>
                  </div>
                  {loading ? (
                    <div className="p-8 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
                    </div>
                  ) : salaryTransactions.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Employee</th>
                          <th className="px-6 py-3">Description</th>
                          <th className="px-6 py-3 text-right">Amount (EGP)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaryTransactions.map((transaction) => {
                          const employee = employees.find(emp => emp._id === transaction.employeeId);
                          return (
                            <tr 
                              key={transaction._id} 
                              className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">{transaction.date}</td>
                              <td className="px-6 py-4">{employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee'}</td>
                              <td className="px-6 py-4">{transaction.description}</td>
                              <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">
                                -{transaction.amount.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No salary payments recorded yet. Use the form to record salary payments.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-lg mb-4">Record Salary Payment</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="employee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employee
                    </label>
                    <select
                      id="employee"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      disabled={loading || processingPayment}
                    >
                      <option value="">Select employee</option>
                      {employees.map((employee) => (
                        <option key={employee._id} value={employee._id}>
                          {employee.firstName} {employee.lastName} - {employee.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount (EGP)
                    </label>
                    <input
                      type="number"
                      id="amount"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      value={salaryAmount}
                      onChange={(e) => setSalaryAmount(e.target.value)}
                      disabled={loading || processingPayment}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      value={salaryNotes}
                      onChange={(e) => setSalaryNotes(e.target.value)}
                      disabled={loading || processingPayment}
                      rows={3}
                    />
                  </div>
                  
                  <button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
                    onClick={handleSalaryPayment}
                    disabled={loading || processingPayment}
                  >
                    {processingPayment ? (
                      <>
                        <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <BanknotesIcon className="h-5 w-5 mr-2" />
                        Record Salary Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Invoices Tab */}
          <TabsContent value="invoices" className="mt-4">
            <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">Invoice management coming soon</p>
            </div>
          </TabsContent>
          
          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-4">
            <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">Financial reports will be available here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 