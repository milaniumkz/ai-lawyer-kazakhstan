import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './styles.css';
import './aizan.css';

export const metadata: Metadata = {
  title: 'Айзан',
  applicationName: 'Айзан',
  appleWebApp: { title: 'Айзан' },
  description: 'Адаптивная веб-версия AI-Юрист Казахстан для ПК и телефона',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
