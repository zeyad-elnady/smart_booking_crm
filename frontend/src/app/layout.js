import { LanguageProvider } from '@/context/LanguageContext';
import './globals.css';

export const metadata = {
  title: 'Bilingual CRM',
  description: 'A bilingual CRM system with Arabic and English support',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
} 