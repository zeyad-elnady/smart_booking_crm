import { useState } from "react";
import { 
  PlusCircleIcon, 
  TrashIcon, 
  PencilIcon,
  XCircleIcon 
} from "@heroicons/react/24/outline";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
import { MedicalCondition, Allergy, CustomField } from "@/types/customer";

interface MedicalInfoSectionProps {
  age?: number;
  medicalConditions?: MedicalCondition[];
  allergies?: Allergy[];
  medicalNotes?: string;
  customFields?: CustomField[];
  isAdmin: boolean;
  onChange: (field: string, value: any) => void;
}

export default function MedicalInfoSection({
  age,
  medicalConditions = [],
  allergies = [],
  medicalNotes = "",
  customFields = [],
  isAdmin,
  onChange,
}: MedicalInfoSectionProps) {
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  
  // State for editing arrays
  const [editingCondition, setEditingCondition] = useState<MedicalCondition | null>(null);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  const [editingCustomField, setEditingCustomField] = useState<CustomField | null>(null);
  
  // State for new items
  const [newCondition, setNewCondition] = useState<MedicalCondition>({ name: "", details: "" });
  const [newAllergy, setNewAllergy] = useState<Allergy>({ name: "", severity: "Moderate" });
  const [newCustomField, setNewCustomField] = useState<CustomField>({ 
    name: "", 
    value: "", 
    fieldType: "text", 
    options: [] 
  });
  
  // Background and text colors based on theme
  const bgColor = darkMode ? "bg-gray-800/50" : "bg-white";
  const textColor = darkMode ? "text-white" : "text-gray-900";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";
  const sectionBg = darkMode ? "bg-gray-900/60" : "bg-gray-50/80";
  const buttonPrimaryBg = darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600";
  const buttonSecondaryBg = darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300";
  
  // Handlers for medical conditions
  const handleAddCondition = () => {
    if (newCondition.name.trim()) {
      const updatedConditions = [...medicalConditions, newCondition];
      onChange("medicalConditions", updatedConditions);
      setNewCondition({ name: "", details: "" });
    }
  };
  
  const handleUpdateCondition = (index: number) => {
    if (editingCondition && editingCondition.name.trim()) {
      const updatedConditions = [...medicalConditions];
      updatedConditions[index] = editingCondition;
      onChange("medicalConditions", updatedConditions);
      setEditingCondition(null);
    }
  };
  
  const handleDeleteCondition = (index: number) => {
    const updatedConditions = [...medicalConditions];
    updatedConditions.splice(index, 1);
    onChange("medicalConditions", updatedConditions);
  };
  
  // Handlers for allergies
  const handleAddAllergy = () => {
    if (newAllergy.name.trim()) {
      const updatedAllergies = [...allergies, newAllergy];
      onChange("allergies", updatedAllergies);
      setNewAllergy({ name: "", severity: "Moderate" });
    }
  };
  
  const handleUpdateAllergy = (index: number) => {
    if (editingAllergy && editingAllergy.name.trim()) {
      const updatedAllergies = [...allergies];
      updatedAllergies[index] = editingAllergy;
      onChange("allergies", updatedAllergies);
      setEditingAllergy(null);
    }
  };
  
  const handleDeleteAllergy = (index: number) => {
    const updatedAllergies = [...allergies];
    updatedAllergies.splice(index, 1);
    onChange("allergies", updatedAllergies);
  };
  
  // Handlers for custom fields
  const handleAddCustomField = () => {
    if (newCustomField.name.trim()) {
      // Convert comma-separated options string to array if needed
      let options = newCustomField.options || [];
      if (typeof options === 'string') {
        options = (options as unknown as string).split(',').map(opt => opt.trim());
      }
      
      const fieldToAdd = {
        ...newCustomField,
        options: options
      };
      
      const updatedCustomFields = [...customFields, fieldToAdd];
      onChange("customFields", updatedCustomFields);
      setNewCustomField({ name: "", value: "", fieldType: "text", options: [] });
    }
  };
  
  const handleUpdateCustomField = (index: number) => {
    if (editingCustomField && editingCustomField.name.trim()) {
      // Convert comma-separated options string to array if needed
      let options = editingCustomField.options || [];
      if (typeof options === 'string') {
        options = (options as unknown as string).split(',').map(opt => opt.trim());
      }
      
      const fieldToUpdate = {
        ...editingCustomField,
        options: options
      };
      
      const updatedCustomFields = [...customFields];
      updatedCustomFields[index] = fieldToUpdate;
      onChange("customFields", updatedCustomFields);
      setEditingCustomField(null);
    }
  };
  
  const handleDeleteCustomField = (index: number) => {
    const updatedCustomFields = [...customFields];
    updatedCustomFields.splice(index, 1);
    onChange("customFields", updatedCustomFields);
  };
  
  return (
    <div className={`rounded-lg ${sectionBg} p-4 shadow-sm border ${borderColor} mb-6`}>
      <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>{t('medical_info')}</h3>
      
      {/* Age field */}
      <div className="mb-4">
        <label htmlFor="age" className={`block text-sm font-medium mb-1 ${textColor}`}>
          {t('age')}
        </label>
        <input
          type="number"
          id="age"
          min="0"
          max="120"
          value={age || ""}
          onChange={(e) => onChange("age", parseInt(e.target.value) || "")}
          className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
        />
      </div>
      
      {/* Medical Conditions Section */}
      <div className="mb-6">
        <h4 className={`font-medium mb-2 ${textColor}`}>{t('medical_conditions')}</h4>
        
        <div className="space-y-3 mb-3">
          {medicalConditions.map((condition, index) => (
            <div key={index} className={`p-3 rounded-md border ${borderColor} ${bgColor}`}>
              {editingCondition && index === medicalConditions.indexOf(editingCondition) ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editingCondition.name}
                    onChange={(e) => setEditingCondition({...editingCondition, name: e.target.value})}
                    placeholder={t('condition_name')}
                    className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                  />
                  <textarea
                    value={editingCondition.details || ""}
                    onChange={(e) => setEditingCondition({...editingCondition, details: e.target.value})}
                    placeholder={t('condition_details')}
                    rows={2}
                    className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => setEditingCondition(null)}
                      className={`px-3 py-1 rounded-md ${buttonSecondaryBg} ${textColor}`}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={() => handleUpdateCondition(index)}
                      className={`px-3 py-1 rounded-md ${buttonPrimaryBg} text-white`}
                    >
                      {t('save')}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start">
                    <h5 className={`font-medium ${textColor}`}>{condition.name}</h5>
                    <div className="flex space-x-1">
                      <button onClick={() => setEditingCondition(condition)} className="text-blue-500 hover:text-blue-700">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteCondition(index)} className="text-red-500 hover:text-red-700">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {condition.details && <p className={`mt-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{condition.details}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className={`p-3 rounded-md border ${borderColor} ${bgColor}`}>
          <div className="space-y-2">
            <input
              type="text"
              value={newCondition.name}
              onChange={(e) => setNewCondition({...newCondition, name: e.target.value})}
              placeholder={t('condition_name')}
              className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
            />
            <textarea
              value={newCondition.details || ""}
              onChange={(e) => setNewCondition({...newCondition, details: e.target.value})}
              placeholder={t('condition_details')}
              rows={2}
              className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddCondition}
                className={`mt-2 px-3 py-1 rounded-md flex items-center ${buttonPrimaryBg} text-white`}
              >
                <PlusCircleIcon className="h-4 w-4 mr-1" />
                {t('add_condition')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Allergies Section */}
      <div className="mb-6">
        <h4 className={`font-medium mb-2 ${textColor}`}>{t('allergies')}</h4>
        
        <div className="space-y-3 mb-3">
          {allergies.map((allergy, index) => (
            <div key={index} className={`p-3 rounded-md border ${borderColor} ${bgColor}`}>
              {editingAllergy && index === allergies.indexOf(editingAllergy) ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editingAllergy.name}
                    onChange={(e) => setEditingAllergy({...editingAllergy, name: e.target.value})}
                    placeholder={t('allergy_name')}
                    className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                  />
                  <select
                    value={editingAllergy.severity}
                    onChange={(e) => setEditingAllergy({...editingAllergy, severity: e.target.value as 'Mild' | 'Moderate' | 'Severe'})}
                    className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                  >
                    <option value="Mild">{t('mild')}</option>
                    <option value="Moderate">{t('moderate')}</option>
                    <option value="Severe">{t('severe')}</option>
                  </select>
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => setEditingAllergy(null)}
                      className={`px-3 py-1 rounded-md ${buttonSecondaryBg} ${textColor}`}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={() => handleUpdateAllergy(index)}
                      className={`px-3 py-1 rounded-md ${buttonPrimaryBg} text-white`}
                    >
                      {t('save')}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start">
                    <h5 className={`font-medium ${textColor}`}>{allergy.name}</h5>
                    <div className="flex space-x-1">
                      <button onClick={() => setEditingAllergy(allergy)} className="text-blue-500 hover:text-blue-700">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteAllergy(index)} className="text-red-500 hover:text-red-700">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
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
              )}
            </div>
          ))}
        </div>
        
        <div className={`p-3 rounded-md border ${borderColor} ${bgColor}`}>
          <div className="space-y-2">
            <input
              type="text"
              value={newAllergy.name}
              onChange={(e) => setNewAllergy({...newAllergy, name: e.target.value})}
              placeholder={t('allergy_name')}
              className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
            />
            <select
              value={newAllergy.severity}
              onChange={(e) => setNewAllergy({...newAllergy, severity: e.target.value as 'Mild' | 'Moderate' | 'Severe'})}
              className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
            >
              <option value="Mild">{t('mild')}</option>
              <option value="Moderate">{t('moderate')}</option>
              <option value="Severe">{t('severe')}</option>
            </select>
            <div className="flex justify-end">
              <button
                onClick={handleAddAllergy}
                className={`mt-2 px-3 py-1 rounded-md flex items-center ${buttonPrimaryBg} text-white`}
              >
                <PlusCircleIcon className="h-4 w-4 mr-1" />
                {t('add_allergy')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Medical Notes */}
      <div className="mb-6">
        <label htmlFor="medicalNotes" className={`block text-sm font-medium mb-1 ${textColor}`}>
          {t('medical_notes')}
        </label>
        <textarea
          id="medicalNotes"
          rows={4}
          value={medicalNotes || ""}
          onChange={(e) => onChange("medicalNotes", e.target.value)}
          className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
        />
      </div>
      
      {/* Custom Fields Section (Only visible for admin) */}
      {isAdmin && (
        <div className="mb-6">
          <h4 className={`font-medium mb-2 ${textColor}`}>{t('custom_fields')}</h4>
          
          <div className="space-y-3 mb-3">
            {customFields.map((field, index) => (
              <div key={index} className={`p-3 rounded-md border ${borderColor} ${bgColor}`}>
                {editingCustomField && index === customFields.indexOf(editingCustomField) ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingCustomField.name}
                      onChange={(e) => setEditingCustomField({...editingCustomField, name: e.target.value})}
                      placeholder={t('field_name')}
                      className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                    />
                    <select
                      value={editingCustomField.fieldType}
                      onChange={(e) => setEditingCustomField({
                        ...editingCustomField, 
                        fieldType: e.target.value as 'text' | 'number' | 'date' | 'boolean' | 'select'
                      })}
                      className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                    >
                      <option value="text">{t('text')}</option>
                      <option value="number">{t('number')}</option>
                      <option value="date">{t('date')}</option>
                      <option value="boolean">{t('boolean')}</option>
                      <option value="select">{t('select')}</option>
                    </select>
                    
                    {editingCustomField.fieldType === 'select' && (
                      <input
                        type="text"
                        value={Array.isArray(editingCustomField.options) ? editingCustomField.options.join(', ') : editingCustomField.options || ''}
                        onChange={(e) => setEditingCustomField({
                          ...editingCustomField, 
                          options: e.target.value.split(',').map(opt => opt.trim())
                        })}
                        placeholder={t('field_options')}
                        className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                      />
                    )}
                    
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => setEditingCustomField(null)}
                        className={`px-3 py-1 rounded-md ${buttonSecondaryBg} ${textColor}`}
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={() => handleUpdateCustomField(index)}
                        className={`px-3 py-1 rounded-md ${buttonPrimaryBg} text-white`}
                      >
                        {t('save')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className={`font-medium ${textColor}`}>{field.name}</h5>
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {t(field.fieldType)}
                          {field.fieldType === 'select' && field.options && field.options.length > 0 && (
                            <span> ({field.options.join(', ')})</span>
                          )}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <button onClick={() => setEditingCustomField(field)} className="text-blue-500 hover:text-blue-700">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteCustomField(index)} className="text-red-500 hover:text-red-700">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className={`p-3 rounded-md border ${borderColor} ${bgColor}`}>
            <div className="space-y-2">
              <input
                type="text"
                value={newCustomField.name}
                onChange={(e) => setNewCustomField({...newCustomField, name: e.target.value})}
                placeholder={t('field_name')}
                className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
              />
              <select
                value={newCustomField.fieldType}
                onChange={(e) => setNewCustomField({
                  ...newCustomField, 
                  fieldType: e.target.value as 'text' | 'number' | 'date' | 'boolean' | 'select'
                })}
                className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
              >
                <option value="text">{t('text')}</option>
                <option value="number">{t('number')}</option>
                <option value="date">{t('date')}</option>
                <option value="boolean">{t('boolean')}</option>
                <option value="select">{t('select')}</option>
              </select>
              
              {newCustomField.fieldType === 'select' && (
                <input
                  type="text"
                  value={Array.isArray(newCustomField.options) ? newCustomField.options.join(', ') : newCustomField.options || ''}
                  onChange={(e) => setNewCustomField({
                    ...newCustomField, 
                    options: e.target.value.split(',').map(opt => opt.trim())
                  })}
                  placeholder={t('field_options')}
                  className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                />
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={handleAddCustomField}
                  className={`mt-2 px-3 py-1 rounded-md flex items-center ${buttonPrimaryBg} text-white`}
                >
                  <PlusCircleIcon className="h-4 w-4 mr-1" />
                  {t('add_field')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Render custom fields (for non-admin view) */}
      {!isAdmin && customFields.length > 0 && (
        <div className="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {customFields.map((field, index) => (
            <div key={index}>
              <label htmlFor={`custom-${index}`} className={`block text-sm font-medium mb-1 ${textColor}`}>
                {field.name}
              </label>
              
              {field.fieldType === 'text' && (
                <input
                  type="text"
                  id={`custom-${index}`}
                  value={field.value || ""}
                  onChange={(e) => {
                    const updatedFields = [...customFields];
                    updatedFields[index] = { ...field, value: e.target.value };
                    onChange("customFields", updatedFields);
                  }}
                  className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                />
              )}
              
              {field.fieldType === 'number' && (
                <input
                  type="number"
                  id={`custom-${index}`}
                  value={field.value || ""}
                  onChange={(e) => {
                    const updatedFields = [...customFields];
                    updatedFields[index] = { ...field, value: e.target.value };
                    onChange("customFields", updatedFields);
                  }}
                  className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                />
              )}
              
              {field.fieldType === 'date' && (
                <input
                  type="date"
                  id={`custom-${index}`}
                  value={field.value || ""}
                  onChange={(e) => {
                    const updatedFields = [...customFields];
                    updatedFields[index] = { ...field, value: e.target.value };
                    onChange("customFields", updatedFields);
                  }}
                  className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                />
              )}
              
              {field.fieldType === 'boolean' && (
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id={`custom-${index}`}
                    checked={field.value === "true"}
                    onChange={(e) => {
                      const updatedFields = [...customFields];
                      updatedFields[index] = { ...field, value: e.target.checked ? "true" : "false" };
                      onChange("customFields", updatedFields);
                    }}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`custom-${index}`} className={`ml-2 block text-sm ${textColor}`}>
                    {t('yes')}
                  </label>
                </div>
              )}
              
              {field.fieldType === 'select' && field.options && field.options.length > 0 && (
                <select
                  id={`custom-${index}`}
                  value={field.value || ""}
                  onChange={(e) => {
                    const updatedFields = [...customFields];
                    updatedFields[index] = { ...field, value: e.target.value };
                    onChange("customFields", updatedFields);
                  }}
                  className={`w-full p-2 rounded-md border ${borderColor} ${bgColor} ${textColor}`}
                >
                  <option value="">{t('select')}</option>
                  {field.options.map((option, i) => (
                    <option key={i} value={option}>{option}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 