"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface">
      <Header />
      <main className="flex-grow flex items-center justify-center py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center rotate-3">
              <span className="material-symbols-outlined text-primary text-4xl -rotate-3 select-none">
                forest
              </span>
            </div>
          </div>
          <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            This path is overgrown.
          </h1>
          <p className="text-on-surface-variant text-base leading-relaxed mb-8">
            The story or path you are looking for has returned to the earth or was never seeded.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold cursor-pointer hover:opacity-85 active:scale-95 transition-all text-sm"
          >
            Return to Home
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
