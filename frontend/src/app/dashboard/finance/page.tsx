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
import { getAllTransactions, createTransaction, updateEmployeeSalaryBalance, getEmployeeSalarySummary, recordSalaryWithdrawal, addDeduction, addReward } from "@/services/financeService";
import { Employee } from "@/types/employee";
import { Transaction } from "@/types/finance";
import { toast } from "react-hot-toast";
import EmployeeSalaryManager from "@/components/EmployeeSalaryManager";
import { useTheme } from "@/components/ThemeProvider";
import { indexedDBService } from "@/services/indexedDB";

export default function FinancePage() {
  const { darkMode } = useTheme();
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
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState<Employee | null>(null);
  const [showSalaryManager, setShowSalaryManager] = useState(false);
  const [transactionType, setTransactionType] = useState<'withdrawal' | 'deduction' | 'reward'>('withdrawal');
  const [transactionReason, setTransactionReason] = useState<string>('');

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

  // Get selected employee's details
  const handleSelectEmployee = async (employeeId: string) => {
    setSelectedEmployee(employeeId);
    
    if (!employeeId) {
      setSelectedEmployeeForSalary(null);
      return;
    }
    
    try {
      // First update the salary balance to ensure it's current
      await updateEmployeeSalaryBalance(employeeId);
      
      // Then get the employee with the updated balance
      const employee = await indexedDBService.getFromStore("employees", employeeId);
      
      if (employee) {
        // Update the selected employee
        setSelectedEmployeeForSalary(employee);
      }
    } catch (error) {
      console.error("Error updating employee salary data:", error);
    }
  };

  // Handle salary-related transaction
  const handleSalaryPayment = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }
    
    if (!salaryAmount || isNaN(parseFloat(salaryAmount)) || parseFloat(salaryAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    // For deduction and reward, require a reason
    if ((transactionType === 'deduction' || transactionType === 'reward') && !transactionReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    // For withdrawal, check if there's enough remaining salary
    if (transactionType === 'withdrawal' && selectedEmployeeForSalary) {
      const amount = parseFloat(salaryAmount);
      if (amount > (selectedEmployeeForSalary.remainingSalary || 0)) {
        toast.error(`Withdrawal amount exceeds remaining salary (${selectedEmployeeForSalary.remainingSalary?.toLocaleString() || 0} EGP)`);
        return;
      }
    }
    
    setProcessingPayment(true);
    
    try {
      const employee = employees.find(emp => emp._id === selectedEmployee);
      const amount = parseFloat(salaryAmount);
      
      if (!employee) {
        toast.error("Employee not found");
        return;
      }

      // Handle different transaction types
      switch (transactionType) {
        case 'withdrawal':
          await recordSalaryWithdrawal(selectedEmployee, amount, transactionReason || salaryNotes || '');
          toast.success("Salary withdrawal recorded successfully");
          break;
          
        case 'deduction':
          await addDeduction(selectedEmployee, amount, transactionReason);
          toast.success("Deduction added successfully");
          break;
          
        case 'reward':
          await addReward(selectedEmployee, amount, transactionReason);
          toast.success("Reward added successfully");
          break;
      }
      
      // Update employee's remaining salary balance
      await updateEmployeeSalaryBalance(selectedEmployee);
      
      // Refresh the selected employee data
      if (selectedEmployee) {
        const updatedEmployee = await indexedDBService.getFromStore("employees", selectedEmployee);
        if (updatedEmployee) {
          setSelectedEmployeeForSalary(updatedEmployee);
        }
      }
      
      // Reset form and refresh data
      setSalaryAmount("");
      setSalaryNotes("");
      setTransactionReason("");
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error processing salary transaction:", error);
      toast.error(`Failed to record ${transactionType}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle base salary setup
  const handleSetBaseSalary = async () => {
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
      
      if (!employee) {
        toast.error("Employee not found");
        return;
      }
      
      // Update employee's base salary
      const updatedEmployee = {
        ...employee,
        baseSalary: parseFloat(salaryAmount),
        remainingSalary: parseFloat(salaryAmount)
      };
      
      // Save to IndexedDB
      await indexedDBService.saveToStore("employees", updatedEmployee);
      
      // Update selected employee
      setSelectedEmployeeForSalary(updatedEmployee);
      
      // Create salary transaction if needed
      if (employee.baseSalary !== parseFloat(salaryAmount)) {
        const salaryTransaction = {
          date: new Date().toISOString().split('T')[0],
          amount: parseFloat(salaryAmount),
          type: "expense" as const,
          category: "Salary",
          description: `Base salary setup for ${employee?.firstName} ${employee?.lastName}${salaryNotes ? ` - ${salaryNotes}` : ''}`,
          paymentMethod: "bank_transfer" as const,
          status: "completed" as const,
          employeeId: selectedEmployee
        };
        
        await createTransaction(salaryTransaction);
      }
      
      // Update salary balance
      await updateEmployeeSalaryBalance(selectedEmployee);
      
      // Refresh the selected employee data to get updated salary information
      const refreshedEmployee = await indexedDBService.getFromStore("employees", selectedEmployee);
      if (refreshedEmployee) {
        setSelectedEmployeeForSalary(refreshedEmployee);
      }
      
      toast.success("Base salary set successfully");
      
      // Update employee in the employees array
      const updatedEmployees = employees.map(emp => 
        emp._id === selectedEmployee ? refreshedEmployee || updatedEmployee : emp
      );
      setEmployees(updatedEmployees);
      
      // Reset form
      setSalaryAmount("");
      setSalaryNotes("");
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error setting base salary:", error);
      toast.error("Failed to set base salary");
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
          <button className="btn bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center">
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
            className="bg-card text-card-foreground rounded-xl shadow p-4 border border-border"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">{stat.title}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
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
              <stat.icon className="h-5 w-5 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs for different financial views */}
      <div className="mt-8">
        <Tabs defaultValue="transactions" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transactions">
              Recent Transactions
            </TabsTrigger>
            <TabsTrigger value="salaries">
              Salaries
            </TabsTrigger>
            <TabsTrigger value="invoices">
              Invoices
            </TabsTrigger>
            <TabsTrigger value="reports">
              Reports
            </TabsTrigger>
          </TabsList>
          
          {/* Recent Transactions Tab */}
          <TabsContent value="transactions" className="mt-4">
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {recentTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className="border-t border-border hover:bg-muted/50 transition-colors"
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
                <div className="bg-card text-card-foreground rounded-xl shadow border border-border overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted">
                    <h2 className="text-lg font-semibold">Salary Management</h2>
                  </div>
                  {loading ? (
                    <div className="p-8 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="employee" className="block text-sm font-medium mb-1">
                            Employee
                          </label>
                          <select
                            id="employee"
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring"
                            value={selectedEmployee}
                            onChange={(e) => handleSelectEmployee(e.target.value)}
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

                        {selectedEmployeeForSalary && (
                          <div className="bg-muted p-4 rounded-lg border border-border">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-medium">{selectedEmployeeForSalary.firstName} {selectedEmployeeForSalary.lastName}</h3>
                                <p className="text-muted-foreground text-sm">{selectedEmployeeForSalary.role}</p>
                              </div>
                              <div className="mt-2 sm:mt-0">
                                <button 
                                  onClick={() => setShowSalaryManager(!showSalaryManager)}
                                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  {showSalaryManager ? 'Hide Salary Details' : 'View Salary Details'}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="bg-card p-3 rounded-lg border border-border shadow-sm">
                                <p className="text-sm text-muted-foreground">Base Salary</p>
                                <p className="font-semibold">
                                  {selectedEmployeeForSalary.baseSalary 
                                    ? `${selectedEmployeeForSalary.baseSalary.toLocaleString()} EGP` 
                                    : "Not set"}
                                </p>
                              </div>
                              <div className="bg-card p-3 rounded-lg border border-border shadow-sm">
                                <p className="text-sm text-muted-foreground">Remaining Salary</p>
                                <p className={`font-semibold ${
                                  !selectedEmployeeForSalary.remainingSalary || selectedEmployeeForSalary.remainingSalary <= 0
                                    ? "text-red-500"
                                    : "text-green-600 dark:text-green-400"
                                }`}>
                                  {selectedEmployeeForSalary.remainingSalary 
                                    ? `${selectedEmployeeForSalary.remainingSalary.toLocaleString()} EGP` 
                                    : "0.00 EGP"}
                                </p>
                              </div>
                            </div>

                            {/* Salary Manager Component */}
                            {showSalaryManager && (
                              <EmployeeSalaryManager 
                                employeeId={selectedEmployeeForSalary._id}
                                employee={selectedEmployeeForSalary}
                                darkMode={darkMode}
                                onUpdate={() => {
                                  // Refresh employee data
                                  setRefreshTrigger(prev => prev + 1);
                                }}
                              />
                            )}
                            
                            {/* Salary Payment History */}
                            <div className="mt-6 border-t border-border pt-4">
                              <h4 className="text-lg font-medium mb-3">Salary Payment History</h4>
                              {loading ? (
                                <div className="p-4 flex justify-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                              ) : (
                                <>
                                  {salaryTransactions
                                    .filter(transaction => transaction.employeeId === selectedEmployeeForSalary._id)
                                    .length > 0 ? (
                                    <div className="overflow-x-auto bg-card rounded-lg border border-border">
                                      <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground border-b border-border">
                                          <tr>
                                            <th className="px-4 py-2 font-medium">Date</th>
                                            <th className="px-4 py-2 font-medium">Description</th>
                                            <th className="px-4 py-2 text-right font-medium">Amount (EGP)</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {salaryTransactions
                                            .filter(transaction => transaction.employeeId === selectedEmployeeForSalary._id)
                                            .map((transaction) => (
                                              <tr 
                                                key={transaction._id} 
                                                className="border-b border-border hover:bg-muted/50 transition-colors"
                                              >
                                                <td className="px-4 py-3 whitespace-nowrap">{transaction.date}</td>
                                                <td className="px-4 py-3">{transaction.description}</td>
                                                <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                                                  -{transaction.amount.toLocaleString()}
                                                </td>
                                              </tr>
                                            ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="p-6 text-center text-muted-foreground bg-card rounded-lg border border-border">
                                      No salary payments recorded for this employee.
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <div className="bg-card text-card-foreground rounded-xl shadow border border-border p-6">
                  <h3 className="font-semibold text-lg mb-4">Record Salary Payment</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="employeePay" className="block text-sm font-medium mb-1">
                        Employee
                      </label>
                      <select
                        id="employeePay"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring"
                        value={selectedEmployee}
                        onChange={(e) => handleSelectEmployee(e.target.value)}
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
                    
                    {/* Transaction Type Selector */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Transaction Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setTransactionType('withdrawal')}
                          className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-center ${
                            transactionType === 'withdrawal'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          }`}
                        >
                          Withdrawal
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransactionType('deduction')}
                          className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-center ${
                            transactionType === 'deduction'
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          }`}
                        >
                          Deduction
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransactionType('reward')}
                          className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-center ${
                            transactionType === 'reward'
                              ? 'bg-green-600 text-white'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          }`}
                        >
                          Reward
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium mb-1">
                        Amount (EGP)
                      </label>
                      <input
                        type="number"
                        id="amount"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring"
                        value={salaryAmount}
                        onChange={(e) => setSalaryAmount(e.target.value)}
                        disabled={loading || processingPayment}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      {transactionType === 'withdrawal' && selectedEmployeeForSalary && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Maximum available: {selectedEmployeeForSalary.remainingSalary?.toLocaleString() || 0} EGP
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium mb-1">
                        {transactionType === 'withdrawal' ? 'Notes (Optional)' : 'Reason'}
                      </label>
                      <textarea
                        id="reason"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring"
                        value={transactionReason}
                        onChange={(e) => setTransactionReason(e.target.value)}
                        disabled={loading || processingPayment}
                        rows={3}
                        placeholder={transactionType === 'withdrawal' 
                          ? "Optional notes for withdrawal" 
                          : transactionType === 'deduction'
                            ? "Reason for deduction (e.g., Absence, Late arrival)"
                            : "Reason for reward (e.g., Overtime, Performance bonus)"}
                      />
                    </div>
                    
                    <button
                      className={`w-full font-medium py-2 px-4 rounded-lg flex items-center justify-center ${
                        processingPayment ? "opacity-70 cursor-not-allowed" : ""
                      } ${
                        transactionType === 'withdrawal'
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                          : transactionType === 'deduction'
                            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
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
                          {transactionType === 'withdrawal' ? 'Record Withdrawal' :
                           transactionType === 'deduction' ? 'Add Deduction' : 'Add Reward'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Invoices Tab */}
          <TabsContent value="invoices" className="mt-4">
            <div className="h-48 flex items-center justify-center bg-muted rounded-lg border border-border">
              <p className="text-muted-foreground">Invoice management coming soon</p>
            </div>
          </TabsContent>
          
          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-4">
            <div className="h-48 flex items-center justify-center bg-muted rounded-lg border border-border">
              <p className="text-muted-foreground">Financial reports will be available here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 