import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./ui-refresh.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sửa Bài - Trợ lý nâng cấp nội dung",
  description: "Viết lại sắc bén - Nâng cấp nội dung trong vài phút.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  (function() {
    try {
      var theme = localStorage.getItem('aica-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  })();
`,
          }}
        />
      </head>
      <body className={`${beVietnam.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
