import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-12 mt-20 bg-surface-container-lowest dark:bg-surface-dim border-t border-outline-variant/30">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-5xl mx-auto gap-8">
        <div className="text-center md:text-left">
          <div className="font-headline text-lg text-primary dark:text-primary-fixed-dim font-bold mb-2">
            Kemitbelajar
          </div>
          <p className="font-label text-sm text-on-surface-variant opacity-90">
            © {new Date().getFullYear()} Kemitbelajar. Built for slow reading.
          </p>
        </div>

        <div className="flex gap-4">
          <button className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container dark:hover:bg-primary dark:hover:text-on-primary transition-all cursor-pointer">
            <span className="material-symbols-outlined text-xl">rss_feed</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container dark:hover:bg-primary dark:hover:text-on-primary transition-all cursor-pointer">
            <span className="material-symbols-outlined text-xl">mail</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

