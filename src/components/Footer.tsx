import React from "react";
import Link from "next/link";
import { useBlog } from "@/context/BlogContext";

export const Footer: React.FC = () => {
  const { posts } = useBlog();

  // Extract unique years from published posts
  const publishedYears = Array.from(
    new Set(
      posts
        .filter((p) => p.status === "published")
        .map((p) => {
          const dateStr = p.publishedAt;
          if (!dateStr) return new Date().getFullYear();
          if (dateStr.toLowerCase() === "today") return new Date().getFullYear();
          const match = dateStr.match(/\b(20\d{2}|19\d{2})\b/);
          return match ? parseInt(match[1], 10) : new Date().getFullYear();
        })
    )
  ).sort((a, b) => b - a);

  return (
    <footer className="w-full py-12 mt-20 bg-surface-container-lowest dark:bg-surface-dim border-t border-outline-variant/30">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start px-8 max-w-5xl mx-auto gap-8">
        <div className="text-center md:text-left flex-1">
          <div className="font-headline text-lg text-primary dark:text-primary-fixed-dim font-bold mb-2">
            Kemitbelajar
          </div>
          <p className="font-label text-sm text-on-surface-variant opacity-90">
            © {new Date().getFullYear()} Kemitbelajar. Built for slow reading.
          </p>
          <div className="flex justify-center md:justify-start gap-4 mt-2 text-xs font-semibold text-on-surface-variant/80">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="text-on-surface-variant/30">•</span>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>

        {publishedYears.length > 0 && (
          <div className="text-center md:text-left flex-1 md:max-w-[200px]">
            <div className="font-label text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-3">
              Archive
            </div>
            <div className="flex flex-wrap md:flex-col gap-x-4 gap-y-1.5 justify-center md:justify-start">
              {publishedYears.map((year) => (
                <Link
                  key={year}
                  href={`/?year=${year}`}
                  className="text-sm font-body text-on-surface-variant hover:text-primary transition-colors"
                >
                  Year {year}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 self-center md:self-start">
          <button className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container dark:hover:bg-primary dark:hover:text-on-primary transition-all cursor-pointer" title="RSS Feed">
            <span className="material-symbols-outlined text-xl">rss_feed</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container dark:hover:bg-primary dark:hover:text-on-primary transition-all cursor-pointer" title="Contact Email">
            <span className="material-symbols-outlined text-xl">mail</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
