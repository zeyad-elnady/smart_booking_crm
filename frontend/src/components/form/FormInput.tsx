import { memo } from 'react';

interface FormInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  [key: string]: any;
}

const FormInput = memo(({ 
  id, 
  label, 
  value, 
  onChange, 
  type = 'text', 
  required = true,
  ...props 
}: FormInputProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300">
      {label}
    </label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full rounded-lg glass border border-white/10 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      required={required}
      {...props}
    />
  </div>
));

FormInput.displayName = 'FormInput';

export default FormInput; 