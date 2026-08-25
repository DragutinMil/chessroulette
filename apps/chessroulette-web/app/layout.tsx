import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { Metadata } from 'next';
import { Sora } from 'next/font/google';
import { AdsScript } from '../components/AdsScript';
import '../styles.css';

// next/font self-hosta fond i racuna fallback metrike (size-adjust) - eliminise FOUT skok
const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sora',
});

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
    <html lang="en" className={sora.variable}>
      <head>
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1.0,maximum-scale=1.0"
        />
        <AdsScript />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MPCPHM7"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
        <SpeedInsights />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),
                  dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-MPCPHM7');
          `,
          }}
        />
      </body>

      {/* Simple Analytics */}
      <script
        data-collect-dnt="true"
        async
        src="https://scripts.simpleanalyticscdn.com/latest.js"
      />

      <Analytics />
    </html>
  );
}
