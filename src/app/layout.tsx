import ClientWrapper from '@/components/ClientWrapper';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Asset Tracker</title>
      </head>
      <body className="bg-gray-900 text-gray-100">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}