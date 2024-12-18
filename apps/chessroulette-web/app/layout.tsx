import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { Metadata } from 'next';
import '../styles.css';

export const metadata: Metadata = {
  title: 'Home | Chessroulette',
  description: '',
};

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>

      {/* Simple Analytics */}
      <script
        data-collect-dnt="true"
        async
        src="https://scripts.simpleanalyticscdn.com/latest.js"
      />
      <SpeedInsights />
      <Analytics />
    </html>
  );
}
