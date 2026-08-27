"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { VoteSection } from "@/components/vote-section";
import { RoadmapBoard } from "@/components/roadmap-board";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/hooks/use-app";
import { Loader2 } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">加载数据中...</p>
    </div>
  );
}

function OAuthCallback() {
  const searchParams = useSearchParams();
  const { login, user } = useApp();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code || user || processing) return;

    setProcessing(true);

    const exchangeCode = async () => {
      try {
        const response = await fetch(
          `/api/auth/callback?code=${encodeURIComponent(code)}`
        );
        const data = await response.json();

        if (data.ok && data.user) {
          login({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatar: data.user.avatar || "",
            isAdmin: false,
          });
        } else {
          console.error("Casdoor login failed:", data.message, data.detail);
        }

        window.history.replaceState({}, "", "/");
      } catch (error) {
        console.error("Casdoor login failed:", error);
        window.history.replaceState({}, "", "/");
      }
    };

    exchangeCode();
  }, [searchParams, login, user, processing]);

  return null;
}

export default function Home() {
  const { loading } = useApp();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Suspense fallback={null}>
        <OAuthCallback />
      </Suspense>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">项目路线图</h1>
          <p className="text-muted-foreground mt-2">
            查看项目进展，投票支持您期望的功能
          </p>
        </div>
        {loading ? (
          <LoadingScreen />
        ) : (
          <>
            <VoteSection />
            <Separator className="my-6" />
            <RoadmapBoard />
          </>
        )}
      </main>
      <footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} 项目路线图</p>
      </footer>
    </div>
  );
}
