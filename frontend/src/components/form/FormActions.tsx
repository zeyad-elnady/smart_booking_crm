import Link from 'next/link';

interface FormActionsProps {
  cancelHref: string;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
}

const FormActions = ({
  cancelHref,
  isSubmitting,
  submitLabel,
  submittingLabel
}: FormActionsProps) => {
  return (
    <div className="flex justify-end space-x-4">
      <Link
        href={cancelHref}
        className="rounded-full px-4 py-2 text-sm font-semibold text-white glass border border-white/10 hover:bg-white/5 transition-all"
      >
        Cancel
      </Link>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`rounded-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:scale-105 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </div>
  );
};

export default FormActions; 