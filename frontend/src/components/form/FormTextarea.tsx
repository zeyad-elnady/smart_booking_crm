import { memo } from 'react';

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
}: FormTextareaProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300">
      {label}
    </label>
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      rows={rows}
      className="mt-1 block w-full rounded-lg glass border border-white/10 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      required={required}
      {...props}
    />
  </div>
));

FormTextarea.displayName = 'FormTextarea';

export default FormTextarea; 