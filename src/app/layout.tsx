import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/hooks/use-app";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "项目路线图",
  description: "查看和管理项目路线图，参与功能投票",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
