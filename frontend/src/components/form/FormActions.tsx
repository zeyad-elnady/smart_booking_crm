import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

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
   submittingLabel,
}: FormActionsProps) => {
   const { darkMode } = useTheme();

   return (
      <div className="flex justify-end space-x-4">
         <Link
            href={cancelHref}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
               darkMode
                  ? "text-white glass border border-white/10 hover:bg-white/5"
                  : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
            }`}
         >
            Cancel
         </Link>
         <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
               darkMode
                  ? "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white"
                  : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
            } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
         >
            {isSubmitting ? submittingLabel : submitLabel}
         </button>
      </div>
   );
};

export default FormActions;
