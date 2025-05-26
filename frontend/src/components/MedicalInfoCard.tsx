import { useTheme } from "./ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
import { Customer, MedicalCondition, Allergy, CustomField } from "@/types/customer";

interface MedicalInfoCardProps {
  customer: Customer;
}

export default function MedicalInfoCard({ customer }: MedicalInfoCardProps) {
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  
  // Background and text colors based on theme
  const bgColor = darkMode ? "bg-gray-800/50" : "bg-white";
  const textColor = darkMode ? "text-white" : "text-gray-900";
  const secondaryTextColor = darkMode ? "text-gray-300" : "text-gray-600";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";
  const sectionBg = darkMode ? "bg-gray-900/60" : "bg-gray-50/80";
  
  // Check if any medical information exists
  const hasMedicalInfo = 
    customer.age !== undefined || 
    (customer.medicalConditions && customer.medicalConditions.length > 0) || 
    (customer.allergies && customer.allergies.length > 0) || 
    customer.medicalNotes || 
    (customer.customFields && customer.customFields.length > 0);
  
  if (!hasMedicalInfo) {
    return null;
  }
  
  return (
    <div className={`rounded-lg ${sectionBg} p-4 shadow-sm border ${borderColor} mb-6`}>
      <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>{t('medical_info')}</h3>
      
      <div className="space-y-4">
        {/* Age */}
        {customer.age !== undefined && (
          <div className="flex items-center">
            <span className={`font-medium ${textColor} w-32`}>{t('age')}:</span>
            <span className={secondaryTextColor}>{customer.age}</span>
          </div>
        )}
        
        {/* Medical Conditions */}
        {customer.medicalConditions && customer.medicalConditions.length > 0 && (
          <div>
            <h4 className={`font-medium ${textColor} mb-2`}>{t('medical_conditions')}</h4>
            <div className="space-y-2">
              {customer.medicalConditions.map((condition, index) => (
                <div key={index} className={`p-3 rounded-md border ${borderColor} ${bgColor}`}>
                  <div className={`font-medium ${textColor}`}>{condition.name}</div>
                  {condition.details && <div className={`mt-1 text-sm ${secondaryTextColor}`}>{condition.details}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Allergies */}
        {customer.allergies && customer.allergies.length > 0 && (
          <div>
            <h4 className={`font-medium ${textColor} mb-2`}>{t('allergies')}</h4>
            <div className="space-y-2">
              {customer.allergies.map((allergy, index) => (
                <div key={index} className={`p-3 rounded-md border ${borderColor} ${bgColor}`}>
                  <div className={`font-medium ${textColor}`}>{allergy.name}</div>
                  <div className="mt-1">
                    <span 
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        allergy.severity === 'Mild' 
                          ? 'bg-green-100 text-green-800' 
                          : allergy.severity === 'Moderate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {t(allergy.severity.toLowerCase())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Medical Notes */}
        {customer.medicalNotes && (
          <div>
            <h4 className={`font-medium ${textColor} mb-2`}>{t('medical_notes')}</h4>
            <div className={`p-3 rounded-md border ${borderColor} ${bgColor}`}>
              <p className={secondaryTextColor}>{customer.medicalNotes}</p>
            </div>
          </div>
        )}
        
        {/* Custom Fields */}
        {customer.customFields && customer.customFields.length > 0 && (
          <div>
            <h4 className={`font-medium ${textColor} mb-2`}>{t('custom_fields')}</h4>
            <div className="space-y-2">
              {customer.customFields.map((field, index) => (
                <div key={index} className={`p-3 rounded-md border ${borderColor} ${bgColor}`}>
                  <div className="flex justify-between">
                    <span className={`font-medium ${textColor}`}>{field.name}</span>
                    <span className={`text-xs ${secondaryTextColor}`}>{t(field.fieldType)}</span>
                  </div>
                  <div className={`mt-1 ${secondaryTextColor}`}>
                    {field.fieldType === 'boolean' ? (
                      field.value === 'true' ? t('yes') : t('no')
                    ) : (
                      field.value || '-'
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 