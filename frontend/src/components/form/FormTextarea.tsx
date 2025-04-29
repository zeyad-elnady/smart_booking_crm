import { memo } from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface FormTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  [key: string]: any;
}

const FormTextarea = memo(({ 
  id, 
  label, 
  value, 
  onChange, 
  required = true,
  rows = 3,
  ...props 
}: FormTextareaProps) => {
  const { darkMode } = useTheme();
  
  return (
  <div>
      <label 
        htmlFor={id} 
        className={`block text-sm font-medium mb-1.5 ${
          darkMode ? 'text-gray-200' : 'text-gray-700'
        } transition-colors duration-200`}
      >
      {label}
        {required && <span className="text-pink-500 ml-1">*</span>}
    </label>
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      rows={rows}
        className={`block w-full rounded-lg resize-none shadow-sm ${
          darkMode 
            ? 'border-white/10 bg-gray-900/60 text-gray-100 placeholder-gray-400/70' 
            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
        } border px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300`}
      required={required}
      {...props}
    />
  </div>
  );
});

FormTextarea.displayName = 'FormTextarea';

export default FormTextarea; 