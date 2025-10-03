import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers'; // Import the Providers component


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Turbo Essen",
  description: "Fast Food in minuets",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        <Providers> {/* This wraps your entire app */}

        {children}
        </Providers>

      </body>
    </html>
  );
}