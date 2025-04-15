'use client';

import { useState, useEffect } from 'react';
import { testAPIConnection } from '@/services/api';

interface ConnectionResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp?: string;
}

export default function ApiConnectionTest() {
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const testResult = await testAPIConnection();
      setResult({
        ...testResult,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(`Test failed: ${err.message}`);
      console.error('API test error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run test on component mount
  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">API Connection Status</h2>
        <button
          onClick={runTest}
          disabled={loading}
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded">
          {error}
        </div>
      )}
      
      {result && (
        <div className={`p-3 rounded border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.success ? 'Connected' : 'Connection Failed'}
            </span>
          </div>
          
          <p className="text-gray-700 mb-2">{result.message}</p>
          
          {result.details && result.success && (
            <div className="mt-2 text-sm">
              <p className="text-gray-500">API Endpoint: {result.details.baseUrl}</p>
              {result.details.appointments && (
                <div className="mt-2">
                  <p className="font-medium text-gray-600">Sample Data:</p>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-24">
                    {JSON.stringify(result.details.appointments, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          <div className="text-xs text-gray-400 mt-2">
            Last checked: {result.timestamp ? new Date(result.timestamp).toLocaleString() : 'Unknown'}
          </div>
        </div>
      )}
    </div>
  );
} 