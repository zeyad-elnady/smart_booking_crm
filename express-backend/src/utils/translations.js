const messages = {
  en: {
    unauthorized: "Unauthorized access",
    success: "Operation successful",
    error: "An error occurred",
    notFound: "Resource not found",
    validationError: "Validation error",
    serverError: "Internal server error",
    clientCreated: "Client created successfully",
    clientUpdated: "Client updated successfully",
    clientDeleted: "Client deleted successfully",
    invalidCredentials: "Invalid credentials",
    tokenExpired: "Token has expired",
    invalidToken: "Invalid token",
    emailExists: "Email already exists",
    phoneExists: "Phone number already exists",
    requiredFields: "Required fields are missing"
  },
  ar: {
    unauthorized: "دخول غير مصرح به",
    success: "العملية ناجحة",
    error: "حدث خطأ",
    notFound: "الموارد غير موجودة",
    validationError: "خطأ في التحقق",
    serverError: "خطأ في الخادم الداخلي",
    clientCreated: "تم إنشاء العميل بنجاح",
    clientUpdated: "تم تحديث العميل بنجاح",
    clientDeleted: "تم حذف العميل بنجاح",
    invalidCredentials: "بيانات الاعتماد غير صالحة",
    tokenExpired: "انتهت صلاحية الرمز",
    invalidToken: "رمز غير صالح",
    emailExists: "البريد الإلكتروني موجود بالفعل",
    phoneExists: "رقم الهاتف موجود بالفعل",
    requiredFields: "الحقول المطلوبة مفقودة"
  }
};

const getMessage = (key, lang = 'en') => {
  return messages[lang]?.[key] || messages.en[key] || key;
};

module.exports = {
  getMessage,
  messages
}; 