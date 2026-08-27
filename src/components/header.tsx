"use client";

import { useApp } from "@/hooks/use-app";
import { CASDOOR_CONFIG } from "@/lib/casdoor";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Shield, User, GitBranch } from "lucide-react";

export function Header() {
  const { user, isAdmin, login, logout } = useApp();

  const handleCasdoorLogin = () => {
    const { serverUrl, clientId, appName, organizationName } = CASDOOR_CONFIG;
    if (!serverUrl || !clientId) return;
    const redirectUri = `${window.location.origin}/`;
    const state = Math.random().toString(36).substring(2);
    const url = `${serverUrl}/login/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=openid profile email&organization=${organizationName}&application=${appName}`;
    window.location.href = url;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        <div className="flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold tracking-tight">项目路线图</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                {isAdmin && (
                  <span className="hidden sm:flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
                    <Shield className="h-3 w-3" />
                    管理员
                  </span>
                )}
                <span className="hidden sm:flex items-center gap-1 text-muted-foreground min-w-0">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-none">{user.email}</span>
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">退出</span>
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={handleCasdoorLogin}>
              <LogIn className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">登录</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
