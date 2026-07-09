"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBlog } from "@/context/BlogContext";
import { useAuth } from "@/context/AuthContext";

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useBlog();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 w-full z-50 transition-all duration-300 backdrop-blur-md bg-background/80 ${
        scrolled ? "py-2 shadow-md" : "py-4 shadow-sm"
      }`}
    >
      <div className="flex justify-between items-center w-full px-6 max-w-5xl mx-auto">
        <Link
          href="/"
          className="font-headline text-2xl font-bold text-primary dark:text-primary-fixed-dim select-none"
        >
          Kemitbelajar
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button
                onClick={() => router.push("/editor")}
                className="bg-primary text-on-primary dark:bg-primary-container dark:text-on-primary-container px-5 py-2 rounded-lg font-bold hover:opacity-85 transition-all active:scale-95 text-sm cursor-pointer shadow-sm"
              >
                New Post
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-variant transition-colors cursor-pointer select-none"
                aria-label="Toggle theme"
              >
                <span className="material-symbols-outlined text-on-surface text-xl">
                  {theme === "light" ? "dark_mode" : "light_mode"}
                </span>
              </button>

              <div
                className="cursor-pointer hover:opacity-80 transition-opacity active:scale-95 flex items-center justify-center"
                onClick={() => router.push("/editor")}
                title="Creator Studio"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-outline-variant/30 object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-3xl select-none">
                    account_circle
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Theme Toggle Button (Public) */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-variant transition-colors cursor-pointer select-none"
                aria-label="Toggle theme"
              >
                <span className="material-symbols-outlined text-on-surface text-xl">
                  {theme === "light" ? "dark_mode" : "light_mode"}
                </span>
              </button>
              
              <button
                onClick={() => router.push("/login")}
                className="bg-primary-container text-on-primary-container border border-primary/20 px-5 py-2 rounded-lg font-bold hover:bg-primary hover:text-on-primary transition-all active:scale-95 text-sm cursor-pointer shadow-sm"
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
