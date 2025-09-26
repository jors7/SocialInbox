import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SocialInbox - Instagram DM Automation Platform",
  description: "ManyChat-style Instagram DM automation platform for complete direct message automation",
  icons: {
    icon: "/socialinbox.png",
    shortcut: "/socialinbox.png",
    apple: "/socialinbox.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/socialinbox.png" type="image/png" />
        <link rel="shortcut icon" href="/socialinbox.png" type="image/png" />
        <link rel="apple-touch-icon" href="/socialinbox.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
