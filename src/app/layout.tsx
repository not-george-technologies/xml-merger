import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XML Merger",
  description: "Merge multiple XML files based on g:id",
  icons: {
    icon: {
      url: "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23059669'%3e%3cpath d='M9 2a1 1 0 000 2h6a1 1 0 100-2H9zM4 7a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7zm3-1a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1H7z'/%3e%3cpath d='M8 9h8M8 12h8M8 15h6'/%3e%3cpath d='M12 6l3 3-3 3V6z' fill='%23dc2626'/%3e%3c/svg%3e",
      type: "image/svg+xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}