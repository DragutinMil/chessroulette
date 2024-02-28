import Header from './_components/Header';
import { StyledJsxRegistry } from './registry';
import './global.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <div
          className="fixed w-full z-50"
          style={{
            background: '#161a2b',
            borderBottom: '1px solid #21263b',
          }}
        >
          <Header className="" />
        </div>
        <div className="pt-32">
          <StyledJsxRegistry>{children}</StyledJsxRegistry>
        </div>
      </body>
    </html>
  );
}
