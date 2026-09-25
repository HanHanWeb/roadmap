"use client";

import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, LogOut, GitBranch, Loader2 } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { user, login, logout } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("请输入邮箱和密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.ok && data.user) {
        login(data.user);
        setShowLogin(false);
        setEmail("");
        setPassword("");
      } else {
        setError(data.message || "登录失败");
      }
    } catch {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        <div className="flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold tracking-tight">项目路线图</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user ? (
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">退出</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowLogin(true)}>
              <LogIn className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">登录</span>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>登录</DialogTitle>
            <DialogDescription>
              访客无需登录即可浏览和投票，登录后可管理内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="login-email">邮箱</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">密码</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              登录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
