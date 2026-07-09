"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBlog } from "@/context/BlogContext";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

function HomeFeedContent() {
  const { posts } = useBlog();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(4); // initial limit for Discover More Stories

  const yearParam = searchParams.get("year");
  const selectedYear = yearParam ? parseInt(yearParam, 10) : null;

  // Only show published posts on the home feed
  const publishedPosts = posts.filter((p) => p.status === "published");

  // Filter posts by year if parameter is present
  const yearFilteredPosts = selectedYear
    ? publishedPosts.filter((p) => {
      const dateStr = p.publishedAt;
      if (!dateStr) return false;
      if (dateStr.toLowerCase() === "today") return new Date().getFullYear() === selectedYear;
      const match = dateStr.match(/\b(20\d{2}|19\d{2})\b/);
      const postYear = match ? parseInt(match[1], 10) : new Date().getFullYear();
      return postYear === selectedYear;
    })
    : publishedPosts;

  // Sort posts by date to find newest
  const sortedNewest = [...yearFilteredPosts].sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });
  const featuredPosts = sortedNewest.slice(0, 3);
  const regularPosts = yearFilteredPosts.filter(
    (p) => !featuredPosts.some((f) => f.id === p.id)
  );

  // Extract unique categories (ignoring case)
  const categories = Array.from(
    new Set(
      publishedPosts
        .flatMap((p) => p.categories || [])
        .filter((c) => c && c.toLowerCase() !== "featured insight")
    )
  );

  // Filter regular posts based on selection
  const filteredPosts = selectedCategory
    ? regularPosts.filter(
      (p) => p.categories && p.categories.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())
    )
    : regularPosts;

  const handlePostClick = (id: string) => {
    router.push(`/posts/${id}`);
  };

  // Pagination: limit the number of posts displayed initially, but only for regular unfiltered viewing
  const isFiltered = selectedCategory !== null || selectedYear !== null || viewMode !== "grid";
  const displayedPosts = isFiltered ? filteredPosts : filteredPosts.slice(0, displayLimit);

  const getGreeting = () => {
    if (user) {
      const hour = new Date().getHours();
      let timeGreeting = "evening";
      if (hour >= 5 && hour < 12) timeGreeting = "morning";
      else if (hour >= 12 && hour < 17) timeGreeting = "afternoon";

      const name = user.name.split(" ")[0];
      return `Good ${timeGreeting}, ${name}.`;
    }
    return "Welcome to Kemitbelajar.";
  };

  const getSubGreeting = () => {
    if (publishedPosts.length > 0) {
      const sortedNewest = [...publishedPosts].sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA;
      });
      const newest = sortedNewest[0];
      if (newest) {
        return `Fresh insights have arrived. Read our newest post: "${newest.title}".`;
      }
    }
    return "New stories have been published. Explore the latest insights below.";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface">
      <Header />

      <main className="flex-grow max-w-5xl w-full mx-auto px-6 py-12">
        {/* Welcome Message */}
        <section className="mb-16">
          <h1 className="font-headline text-5xl md:text-6xl text-on-surface font-bold tracking-tight mb-4">
            {getGreeting()}
          </h1>
          <p className="text-on-surface-variant text-xl max-w-2xl leading-relaxed">
            {getSubGreeting()}
          </p>
        </section>

        {/* Featured Posts Section (3 Newest) */}
        {featuredPosts.length > 0 && (
          <section className="mb-20">
            <h3 className="font-headline text-2xl font-bold mb-6 text-on-surface border-b border-outline-variant/20 pb-3 select-none">
              Featured Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className="group cursor-pointer flex flex-col justify-between h-full bg-surface-container-low dark:bg-surface-container p-6 rounded-xl border border-outline-variant/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    <div className="rounded-lg overflow-hidden mb-4 aspect-video bg-surface-container-high relative">
                      {post.image ? (
                        <img
                          src={post.image}
                          alt={post.imageAlt || post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-tertiary-container/10">
                          <span className="material-symbols-outlined text-tertiary text-4xl">
                            auto_stories
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.categories && post.categories.map((cat) => (
                        <span key={cat} className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {cat}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-headline text-xl font-bold mb-2 group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors line-clamp-2">
                      {post.title}
                    </h4>
                    <p className="text-on-surface-variant text-sm line-clamp-2 mb-4 leading-relaxed">
                      {post.summary}
                    </p>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium mt-auto pt-2 border-t border-outline-variant/10">
                    {post.readTime} • {post.publishedAt}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Post Grid Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-outline-variant/30 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${selectedCategory === null
                ? "bg-primary text-on-primary"
                : "bg-surface-container hover:bg-surface-variant text-on-surface-variant"
                }`}
            >
              All Exploration
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${selectedCategory?.toLowerCase() === cat.toLowerCase()
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container hover:bg-surface-variant text-on-surface-variant"
                  }`}
              >
                {cat}
              </button>
            ))}
            {selectedYear && (
              <div className="flex items-center gap-1.5 bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider select-none">
                <span>Year: {selectedYear}</span>
                <button
                  onClick={() => router.push("/")}
                  className="hover:text-primary transition-colors flex items-center justify-center cursor-pointer ml-1"
                  title="Clear Year Filter"
                >
                  <span className="material-symbols-outlined text-sm font-bold">close</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 justify-end">
            <h3 className="font-headline text-xl font-semibold text-on-surface mr-auto md:mr-0 hidden sm:block">
              Recent Explorations
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-full transition-colors cursor-pointer ${viewMode === "grid"
                  ? "bg-surface-variant text-primary"
                  : "hover:bg-surface-variant text-on-surface-variant"
                  }`}
                aria-label="Grid View"
                title="Grid View"
              >
                <span className="material-symbols-outlined">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-full transition-colors cursor-pointer ${viewMode === "list"
                  ? "bg-surface-variant text-primary"
                  : "hover:bg-surface-variant text-on-surface-variant"
                  }`}
                aria-label="List View"
                title="List View"
              >
                <span className="material-symbols-outlined">view_list</span>
              </button>
            </div>
          </div>
        </div>

        {/* Posts Layout (Bento Grid or List View) */}
        {viewMode === "list" ? (
          <div className="flex flex-col gap-6">
            {displayedPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="group cursor-pointer p-6 bg-surface-container-low dark:bg-surface-container rounded-xl soft-shadow transition-all duration-300 hover:-translate-y-0.5 flex flex-col md:flex-row gap-6 items-center"
              >
                {post.image && (
                  <div className="w-full md:w-48 aspect-[4/3] rounded-lg overflow-hidden shrink-0 bg-surface-container-high">
                    <img
                      src={post.image}
                      alt={post.imageAlt || post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {post.categories && post.categories.map((cat) => (
                      <span key={cat} className="text-xs font-bold text-tertiary dark:text-tertiary-container uppercase tracking-wider">
                        {cat}
                      </span>
                    ))}
                  </div>
                  <h4 className="font-headline text-2xl font-bold mb-2 group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                    {post.summary}
                  </p>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {post.readTime} • {post.publishedAt}
                  </p>
                </div>
              </article>
            ))}
            {displayedPosts.length === 0 && (
              <div className="text-center py-12 text-on-surface-variant italic">
                No entries found in this exploration area.
              </div>
            )}
          </div>
        ) : (
          /* Bento Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {/* We dynamically map index to col span to maintain the Stitch Bento structure */}
            {displayedPosts.map((post, idx) => {
              // Map posts in order to Stitch templates:
              // Index 0: Article 1 -> col-span-3 (with aspect-video)
              // Index 1: Article 2 -> col-span-3 (with aspect-video)
              // Index 2: Article 3 -> col-span-2 (with aspect-square)
              // Index 3: Article 4 -> col-span-4 (text-only, dark-themed box)
              // Subsequent indexes: col-span-3
              let colSpanClass = "md:col-span-3";
              let cardStyle = "standard";

              if (!selectedCategory && displayedPosts.length >= 4) {
                if (idx === 0) {
                  colSpanClass = "md:col-span-3";
                } else if (idx === 1) {
                  colSpanClass = "md:col-span-3";
                } else if (idx === 2) {
                  colSpanClass = "md:col-span-2";
                  cardStyle = "square";
                } else if (idx === 3) {
                  colSpanClass = "md:col-span-4";
                  cardStyle = "text-only";
                }
              } else if (!selectedCategory) {
                if (displayedPosts.length === 3) {
                  colSpanClass = "md:col-span-2";
                } else if (displayedPosts.length === 1) {
                  colSpanClass = "md:col-span-6";
                } else {
                  colSpanClass = "md:col-span-3";
                }
              }

              if (cardStyle === "text-only") {
                return (
                  <article
                    key={post.id}
                    onClick={() => handlePostClick(post.id)}
                    className={`${colSpanClass} group cursor-pointer h-full bg-surface-container-low dark:bg-surface-container rounded-xl p-8 flex flex-col justify-center relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
                  >
                    <span
                      className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-4xl mb-4"
                    >
                      auto_stories
                    </span>
                    <h4 className="font-headline text-2xl font-bold mb-4 max-w-sm group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-on-surface-variant text-lg mb-6 leading-relaxed">
                      {post.summary}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-wrap gap-1.5">
                        {post.categories && post.categories.length > 0 ? (
                          post.categories.map((cat) => (
                            <span key={cat} className="text-xs font-bold text-primary dark:text-primary-fixed-dim uppercase tracking-wider">
                              {cat}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-bold text-primary dark:text-primary-fixed-dim uppercase tracking-wider">
                            Long Read
                          </span>
                        )}
                      </div>
                      <span className="w-1.5 h-1.5 bg-outline-variant/50 rounded-full"></span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {post.readTime} • {post.publishedAt}
                      </span>
                    </div>
                  </article>
                );
              }

              if (cardStyle === "square") {
                return (
                  <article
                    key={post.id}
                    onClick={() => handlePostClick(post.id)}
                    className={`${colSpanClass} group cursor-pointer`}
                  >
                    <div className="rounded-xl overflow-hidden mb-4 aspect-square bg-surface-container-high soft-shadow">
                      {post.image ? (
                        <img
                          src={post.image}
                          alt={post.imageAlt || post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-tertiary-container/10">
                          <span className="material-symbols-outlined text-tertiary text-4xl">
                            image
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="px-2">
                      <h4 className="font-headline text-lg font-bold mb-2 group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors">
                        {post.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-medium">
                        {post.readTime} • {post.publishedAt}
                      </p>
                    </div>
                  </article>
                );
              }

              // Standard Cards (col-span-3 with aspect-video image)
              return (
                <article
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className={`${colSpanClass} group cursor-pointer`}
                >
                  <div className="rounded-xl overflow-hidden mb-4 aspect-video bg-surface-container-high soft-shadow">
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.imageAlt || post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-tertiary-container/10">
                        <span className="material-symbols-outlined text-tertiary text-4xl">
                          auto_stories
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-2">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.categories && post.categories.map((cat) => (
                        <span key={cat} className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {cat}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-headline text-xl font-bold mb-2 group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                      {post.summary}
                    </p>
                    <p className="text-xs text-on-surface-variant font-medium">
                      {post.readTime} • {post.publishedAt}
                    </p>
                  </div>
                </article>
              );
            })}
            {displayedPosts.length === 0 && (
              <div className="col-span-full text-center py-12 text-on-surface-variant italic">
                No entries found in this exploration area.
              </div>
            )}
          </div>
        )}

        {/* Load More Button */}
        {!isFiltered && displayLimit < filteredPosts.length && (
          <div className="mt-16 flex justify-center">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 4)}
              className="bg-surface-container-highest text-on-surface px-8 py-3 rounded-full font-bold hover:bg-primary hover:text-on-primary dark:hover:bg-primary-container dark:hover:text-on-primary-container transition-all duration-300 active:scale-95 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              Discover More Stories
              <span className="material-symbols-outlined text-lg">expand_more</span>
            </button>
          </div>
        )}
      </main>

      <Footer />

      {/* Simple FAB for mobile creation */}
      <button
        onClick={() => router.push("/editor")}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-on-primary dark:bg-primary-container dark:text-on-primary-container rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all z-50 cursor-pointer hover:opacity-95"
        aria-label="New Post"
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          add
        </span>
      </button>
    </div>
  );
}

export default function HomeFeed() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-on-surface-variant font-headline min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">
              sync
            </span>
            <span>Loading feed...</span>
          </div>
        </div>
      }
    >
      <HomeFeedContent />
    </Suspense>
  );
}
