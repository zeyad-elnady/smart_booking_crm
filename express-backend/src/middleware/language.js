const { getMessage } = require('../utils/translations');

const languageMiddleware = (req, res, next) => {
  // Get language from query parameter, header, or default to 'en'
  const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
  
  // Validate language
  if (!['en', 'ar'].includes(lang)) {
    return res.status(400).json({
      success: false,
      message: getMessage('error', 'en'),
      error: 'Invalid language code'
    });
  }

  // Add language to request object
  req.lang = lang;
  
  // Add translation helper to response object
  res.translate = (key) => getMessage(key, lang);
  
  next();
};

module.exports = languageMiddleware; 