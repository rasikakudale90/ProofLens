"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  Zap,
  Sparkles,
  X,
  Briefcase,
} from "lucide-react";
import { UserProfile, AuthResponse } from "@/lib/types";
import { api } from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAuthSuccess: (user: UserProfile, token: string) => void;
  canDismiss?: boolean;
  initialEmail?: string;
  registeredUsers?: UserProfile[];
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  canDismiss = false,
  initialEmail = "",
  registeredUsers,
}: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Forensic Auditor");
  const [avatarColor, setAvatarColor] = useState("#6366f1");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setTab("login");
    }
  }, [initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let res: AuthResponse;
      if (tab === "login") {
        res = await api.login({ email: email.trim(), password });
      } else {
        res = await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
          role: role.trim(),
          avatar_color: avatarColor,
        });
      }
      onAuthSuccess(res.user, res.access_token);
      if (onClose) onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setError(null);
    setEmail(demoEmail);
    setPassword("password123");
    setIsLoading(true);
    try {
      const res = await api.login({ email: demoEmail, password: "password123" });
      onAuthSuccess(res.user, res.access_token);
      if (onClose) onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log in.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const colorOptions = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-[16px] max-w-[440px] w-full shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border bg-surface-muted/30 relative">
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-[7px] text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-1.5">
                ProofLens AI
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-primary/10 text-primary">
                  Secure Access
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authentication required for document provenance & workspace audits
              </p>
            </div>
          </div>

          {/* Quick Demo Logins Banner */}
          <div className="mt-4 pt-3 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 text-warning" />
              <span>One-Click Team Login</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {[
                { name: "Rasika Kudale", email: "rasika@prooflens.ai", tag: "Lead" },
                { name: "Alex Vance", email: "alex@prooflens.ai", tag: "Analyst" },
                { name: "Devin Hayes", email: "devin@prooflens.ai", tag: "Officer" },
              ].map((member) => (
                <button
                  key={member.email}
                  type="button"
                  onClick={() => handleQuickLogin(member.email)}
                  disabled={isLoading}
                  className="flex flex-col items-start p-2 rounded-[7px] border border-border bg-surface hover:bg-surface-muted hover:border-primary/50 text-left transition-all text-xs group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {member.name.split(" ")[0]}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium bg-surface-muted px-1 rounded">
                      {member.tag}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate w-full">
                    {member.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border bg-surface-muted/20">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors border-b-2 ${
              tab === "login"
                ? "border-primary text-primary bg-surface font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors border-b-2 ${
              tab === "register"
                ? "border-primary text-primary bg-surface font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-[8px] bg-danger-soft text-danger text-xs border border-danger/20 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === "register" && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rasika Kudale"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-border rounded-[8px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Professional Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Lead Forensic Auditor"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-border rounded-[8px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">
                  Avatar Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        avatarColor === c
                          ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-surface"
                          : "opacity-75 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@prooflens.ai"
                className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-border rounded-[8px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 text-xs bg-surface border border-border rounded-[8px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[8px] text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-sm mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{tab === "login" ? "Sign In to ProofLens" : "Create Account & Sign In"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
