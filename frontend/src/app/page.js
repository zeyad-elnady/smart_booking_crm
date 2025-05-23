'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function Dashboard() {
  const { t, toggleLanguage, language } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="header">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
            <button
              onClick={toggleLanguage}
              className="lang-switch"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions Card */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">{t('actions')}</h2>
            <button className="btn btn-primary w-full mb-3">
              {t('add_client')}
            </button>
            <button className="btn btn-secondary w-full">
              {t('view')} {t('clients')}
            </button>
          </div>

          {/* Stats Card */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">{t('status')}</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>{t('clients')}</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t('notifications')}</span>
                <span className="font-bold">0</span>
              </div>
            </div>
          </div>

          {/* Search Card */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">{t('search')}</h2>
            <input
              type="text"
              placeholder={t('search')}
              className="input"
            />
          </div>
        </div>
      </main>
    </div>
  );
} 