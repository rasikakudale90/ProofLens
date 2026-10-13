"use client";

import React, { useState, useRef, useEffect } from "react";
import { UserProfile } from "@/lib/types";
import { Check, ChevronDown, Plus, UserPlus, Users, X, Loader2, LogOut, Key } from "lucide-react";

interface UserSwitcherProps {
  users: UserProfile[];
  currentUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onCreateUser: (payload: { name: string; email: string; password?: string; role: string; avatar_color: string }) => Promise<void>;
  onLogout?: () => void;
  onOpenAuth?: (prefillEmail?: string) => void;
  isCollapsed?: boolean;
}

export function UserSwitcher({
  users,
  currentUser,
  onSelectUser,
  onCreateUser,
  onLogout,
  onOpenAuth,
  isCollapsed = false,
}: UserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState("Forensic Analyst");
  const [avatarColor, setAvatarColor] = useState("#6366f1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || "password123",
        role: role.trim(),
        avatar_color: avatarColor,
      });
      setName("");
      setEmail("");
      setPassword("password123");
      setIsModalOpen(false);
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to create user:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorOptions = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={currentUser ? `${currentUser.name} (${currentUser.role})` : "Select User"}
          className={`w-full flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-surface-muted transition-all border border-transparent hover:border-border text-left ${
            isCollapsed ? "justify-center p-1.5" : ""
          }`}
        >
          {/* Avatar circle */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-xs ring-2 ring-surface relative"
            style={{ backgroundColor: currentUser?.avatar_color || "#6366f1" }}
          >
            <span>{currentUser ? getInitials(currentUser.name) : "U"}</span>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-success rounded-full ring-1 ring-surface" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground truncate leading-tight">
                {currentUser?.name || "Select User"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                {currentUser?.role || "Multiuser Access"}
              </span>
            </div>
          )}

          {!isCollapsed && (
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={`absolute z-50 bottom-full mb-2 bg-surface border border-border rounded-[10px] shadow-lg py-1.5 animate-in fade-in zoom-in-95 duration-150 ${
              isCollapsed ? "left-0 w-64" : "left-0 right-0 w-full min-w-[230px]"
            }`}
          >
            <div className="px-3 py-1.5 border-b border-border/60 flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Active Profiles ({users.length})
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                  setIsOpen(false);
                }}
                className="text-primary hover:text-primary-hover flex items-center gap-1 text-[11px] font-medium transition-colors"
              >
                <Plus className="w-3 h-3" />
                New
              </button>
            </div>

            {/* User List */}
            <div className="max-h-56 overflow-y-auto py-1">
              {users.map((u) => {
                const isSelected = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      if (u.id === currentUser?.id) {
                        setIsOpen(false);
                        return;
                      }
                      if (onOpenAuth) {
                        onOpenAuth(u.email);
                      } else {
                        onSelectUser(u);
                      }
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-muted transition-colors text-xs ${
                      isSelected ? "bg-accent text-accent-foreground font-semibold" : "text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-2xs"
                        style={{ backgroundColor: u.avatar_color }}
                      >
                        {getInitials(u.name)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate leading-tight">{u.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate leading-tight">
                          {u.role}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons Footer */}
            <div className="p-2 border-t border-border/60 flex flex-col gap-1">
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[6px] text-xs font-medium bg-surface-muted hover:bg-surface-muted/80 text-foreground border border-border transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-primary" />
                <span>Add Team Member</span>
              </button>

              {onOpenAuth && (
                <button
                  onClick={() => {
                    onOpenAuth();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[6px] text-xs font-medium hover:bg-surface-muted text-foreground transition-colors"
                >
                  <Key className="w-3.5 h-3.5 text-warning" />
                  <span>Switch Account / Sign In</span>
                </button>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[6px] text-xs font-medium hover:bg-danger-soft text-danger transition-colors mt-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New User Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-[12px] p-6 max-w-sm w-full shadow-xl flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Add Team Member</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Create profile for multiuser workspace access
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-[6px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Jane Auditor"
                  className="w-full text-xs bg-surface border border-border rounded-[7px] px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full text-xs bg-surface border border-border rounded-[7px] px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1">
                  Account Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (default: password123)"
                  className="w-full text-xs bg-surface border border-border rounded-[7px] px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1">
                  Role Title
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Auditor, Legal Counsel"
                  className="w-full text-xs bg-surface border border-border rounded-[7px] px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-foreground mb-1.5">
                  Avatar Color
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        avatarColor === c ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-surface" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground font-medium rounded-[7px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !email.trim() || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[7px] text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
