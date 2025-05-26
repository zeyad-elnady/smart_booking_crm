import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { Transaction } from '@/types/finance';
import { 
  getEmployeeSalarySummary, 
  updateEmployeeSalaryBalance 
} from '@/services/financeService';
import { toast } from 'react-hot-toast';
import { indexedDBService } from '@/services/indexedDB';

interface EmployeeSalaryManagerProps {
  employeeId: string;
  employee: Employee;
  darkMode: boolean;
  onUpdate: () => void;
}

interface SalarySummary {
  baseSalary: number;
  remainingSalary: number;
  withdrawals: Transaction[];
  deductions: {
    amount: number;
    reason: string;
    date: string;
  }[];
  rewards: {
    amount: number;
    reason: string;
    date: string;
  }[];
}

export default function EmployeeSalaryManager({ 
  employeeId, 
  employee, 
  darkMode,
  onUpdate 
}: EmployeeSalaryManagerProps) {
  const [loading, setLoading] = useState(true);
  const [salarySummary, setSalarySummary] = useState<SalarySummary | null>(null);

  // Load employee salary data
  useEffect(() => {
    loadSalarySummary();
  }, [employeeId, employee]);

  const loadSalarySummary = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      // First ensure salary balance is up to date
      await updateEmployeeSalaryBalance(employeeId);
      
      // Then get the summary
      const summary = await getEmployeeSalarySummary(employeeId);
      setSalarySummary(summary);
    } catch (error) {
      console.error('Error loading salary summary:', error);
      toast.error('Failed to load salary information');
    } finally {
      setLoading(false);
    }
  };

  // Format date in a readable format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${
      darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    }`}>
      <div className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Salary Summary</h3>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <span className={`block text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Base Salary:
            </span>
            <span className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {loading ? '...' : salarySummary ? `${salarySummary.baseSalary.toLocaleString()} EGP` : 'Not set'}
            </span>
          </div>
          <div>
            <span className={`block text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Remaining:
            </span>
            <span className={`text-lg font-semibold ${
              loading ? '' : salarySummary && salarySummary.remainingSalary <= 0 
                ? "text-red-500" 
                : darkMode ? "text-green-400" : "text-green-600"
            }`}>
              {loading 
                ? '...' 
                : salarySummary 
                  ? `${salarySummary.remainingSalary.toLocaleString()} EGP` 
                  : '0 EGP'
              }
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recent Withdrawals */}
            {salarySummary && salarySummary.withdrawals.length > 0 && (
              <div>
                <h4 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-2`}>
                  Recent Withdrawals
                </h4>
                <div className={`border rounded-lg divide-y ${
                  darkMode ? "border-gray-700 divide-gray-700" : "border-gray-200 divide-gray-200"
                }`}>
                  {salarySummary.withdrawals.map((withdrawal) => (
                    <div key={withdrawal._id} className="p-3 flex justify-between items-center">
                      <div>
                        <div className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {withdrawal.amount.toLocaleString()} EGP
                        </div>
                        <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {formatDate(withdrawal.date)}
                        </div>
                      </div>
                      <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {withdrawal.description.replace('Salary withdrawal - ', '').replace('Salary withdrawal', '')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recent Deductions */}
            {salarySummary && salarySummary.deductions.length > 0 && (
              <div>
                <h4 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-2`}>
                  Recent Deductions
                </h4>
                <div className={`border rounded-lg divide-y ${
                  darkMode ? "border-gray-700 divide-gray-700" : "border-gray-200 divide-gray-200"
                }`}>
                  {salarySummary.deductions.map((deduction, index) => (
                    <div key={index} className="p-3 flex justify-between items-center">
                      <div>
                        <div className={`font-medium text-red-500`}>
                          -{deduction.amount.toLocaleString()} EGP
                        </div>
                        <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {formatDate(deduction.date)}
                        </div>
                      </div>
                      <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {deduction.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recent Rewards */}
            {salarySummary && salarySummary.rewards.length > 0 && (
              <div>
                <h4 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-2`}>
                  Recent Rewards
                </h4>
                <div className={`border rounded-lg divide-y ${
                  darkMode ? "border-gray-700 divide-gray-700" : "border-gray-200 divide-gray-200"
                }`}>
                  {salarySummary.rewards.map((reward, index) => (
                    <div key={index} className="p-3 flex justify-between items-center">
                      <div>
                        <div className={`font-medium text-green-500`}>
                          +{reward.amount.toLocaleString()} EGP
                        </div>
                        <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {formatDate(reward.date)}
                        </div>
                      </div>
                      <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {reward.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No transactions message */}
            {salarySummary && 
              salarySummary.withdrawals.length === 0 && 
              salarySummary.deductions.length === 0 && 
              salarySummary.rewards.length === 0 && (
                <div className="py-6 text-center">
                  <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    No salary transactions found for the current month.
                  </p>
                </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
} 