'use client';

import { TrashIcon } from '@heroicons/react/24/outline';

interface DeleteCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  darkMode?: boolean;
  isDeleting?: boolean;
}

export default function DeleteCustomerDialog({
  isOpen,
  onClose,
  onConfirm,
  darkMode = false,
  isDeleting = false
}: DeleteCustomerDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className={`w-full max-w-sm mx-auto rounded-lg shadow-xl overflow-hidden ${
        darkMode ? "bg-gray-900" : "bg-white"
      }`}>
        <div className="text-center p-5">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            darkMode ? "bg-red-900/20" : "bg-red-100"
          } mb-4`}>
            <TrashIcon className={`h-6 w-6 ${
              darkMode ? "text-red-400" : "text-red-600"
            }`} aria-hidden="true" />
          </div>
          <h3 className={`text-xl font-semibold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}>
            Delete Customer
          </h3>
          <div className={`mt-2 ${
            darkMode ? "text-gray-300" : "text-gray-500"
          }`}>
            <p>Are you sure you want to delete this customer?</p>
            <p className="mt-1">This will also delete all their appointments.</p>
            <p className="mt-1">This action cannot be undone.</p>
          </div>
        </div>

        <div className={`flex justify-end ${darkMode ? "bg-gray-800/80" : "bg-gray-50"} p-4 gap-3`}>
          <button
            type="button"
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            } transition-colors`}
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              darkMode
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-red-600 text-white hover:bg-red-700"
            } transition-colors flex items-center`}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              <>Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 