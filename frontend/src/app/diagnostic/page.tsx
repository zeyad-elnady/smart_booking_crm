import ApiConnectionTest from '@/components/ApiConnectionTest';
import dynamic from 'next/dynamic';

// Import browser info component with no SSR since it uses browser-specific APIs
const BrowserInfo = dynamic(() => import('@/components/BrowserInfo'), { ssr: false });

export const metadata = {
  title: 'System Diagnostics - Smart Booking CRM',
  description: 'Diagnostic tools and system status for Smart Booking CRM',
};

export default function DiagnosticPage() {
  return (
    <div className="mx-auto container py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">System Diagnostics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Backend Connectivity</h2>
          <ApiConnectionTest />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">System Information</h2>
          <div className="p-4 bg-white rounded-lg shadow-md">
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Environment</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Frontend Version:</div>
                <div>0.1.0</div>
                <div className="text-gray-500">Mode:</div>
                <div>{process.env.NODE_ENV || 'development'}</div>
                <div className="text-gray-500">Runtime:</div>
                <div>Next.js</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Browser Information</h3>
              <BrowserInfo />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h3 className="font-medium text-gray-700 mb-2">Common Issues</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
            <li>
              <strong>API connection errors:</strong> Ensure the backend server is running on port 5000. Check terminal for any error messages.
            </li>
            <li>
              <strong>CORS issues:</strong> The backend is configured to allow all origins for local development. If you're experiencing CORS issues, ensure the backend is properly configured.
            </li>
            <li>
              <strong>Database errors:</strong> The system can operate with local storage if MongoDB is not connected. Check the backend logs for database connection status.
            </li>
          </ul>
          
          <h3 className="font-medium text-gray-700 mt-4 mb-2">Support</h3>
          <p className="text-sm text-gray-600">
            If you're experiencing technical issues, please contact support or refer to the documentation for more information.
          </p>
        </div>
      </div>
    </div>
  );
} 