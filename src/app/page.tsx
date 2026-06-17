"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useBlog } from "@/context/BlogContext";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function HomeFeed() {
  const { posts } = useBlog();
  const { user } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(4); // initial limit for Discover More Stories

  // Only show published posts on the home feed
  const publishedPosts = posts.filter((p) => p.status === "published");

  // Separate featured post and other posts
  const featuredPost = publishedPosts.find((p) => p.isFeatured) || publishedPosts[0];
  const regularPosts = publishedPosts.filter((p) => p.id !== featuredPost?.id);

  // Extract unique categories (ignoring case)
  const categories = Array.from(
    new Set(
      publishedPosts
        .map((p) => p.category)
        .filter((c) => c && c.toLowerCase() !== "featured insight")
    )
  );

  // Filter regular posts based on selection
  const filteredPosts = selectedCategory
    ? regularPosts.filter(
      (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
    )
    : regularPosts;

  const handlePostClick = (id: string) => {
    router.push(`/posts/${id}`);
  };

  // Pagination: limit the number of posts displayed initially, but only for regular unfiltered viewing
  const isFiltered = selectedCategory !== null || viewMode !== "grid";
  const displayedPosts = isFiltered ? filteredPosts : filteredPosts.slice(0, displayLimit);

  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "Selamat malam";
    if (hour >= 5 && hour < 12) timeGreeting = "Selamat pagi";
    else if (hour >= 12 && hour < 15) timeGreeting = "Selamat siang";
    else if (hour >= 15 && hour < 18) timeGreeting = "Selamat sore";

    const name = user ? user.name.split(" ")[0] : "Writer";
    return `Halo, ${timeGreeting} ${name}.`;
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
            The air is crisp, the coffee is warm, and the canvas is ready. What story is taking root today?
          </p>
        </section>

        {/* Featured Post Section */}
        {featuredPost && (
          <section className="mb-20">
            <div
              onClick={() => handlePostClick(featuredPost.id)}
              className="group relative overflow-hidden rounded-xl bg-surface-container-low soft-shadow transition-all duration-500 hover:-translate-y-1 cursor-pointer"
            >
              <div className="grid md:grid-cols-2 items-center">
                <div className="aspect-[4/3] overflow-hidden bg-surface-container-high">
                  {featuredPost.image ? (
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.imageAlt || featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-tertiary-container/10">
                      <span className="material-symbols-outlined text-tertiary text-6xl">
                        auto_stories
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-8 md:p-12">
                  <span className="text-tertiary dark:text-tertiary-container font-bold text-sm tracking-widest uppercase mb-4 block">
                    {featuredPost.category}
                  </span>
                  <h2 className="font-headline text-3xl md:text-4xl text-on-surface mb-6 leading-tight group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-on-surface-variant text-lg mb-8 leading-relaxed line-clamp-3">
                    {featuredPost.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container dark:bg-primary flex items-center justify-center text-on-primary-container dark:text-on-primary">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          person
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">
                          {featuredPost.author.name}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {featuredPost.readTime} • {featuredPost.publishedAt}
                        </p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 text-primary dark:text-primary-fixed-dim font-bold group-hover:translate-x-2 transition-transform cursor-pointer">
                      Read Story{" "}
                      <span className="material-symbols-outlined text-lg">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </div>
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
                  <div className="flex gap-2 mb-2">
                    <span className="text-xs font-bold text-tertiary dark:text-tertiary-container uppercase tracking-wider">
                      {post.category}
                    </span>
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

              if (!selectedCategory) {
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
              }

              if (cardStyle === "text-only") {
                return (
                  <article
                    key={post.id}
                    onClick={() => handlePostClick(post.id)}
                    className={`${colSpanClass} group cursor-pointer h-full bg-tertiary-container/10 border border-tertiary/10 rounded-xl p-8 flex flex-col justify-center relative overflow-hidden soft-shadow`}
                  >
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl group-hover:bg-tertiary/20 transition-all duration-700"></div>
                    <span
                      className="material-symbols-outlined text-tertiary dark:text-tertiary-container text-4xl mb-4"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_stories
                    </span>
                    <h4 className="font-headline text-2xl font-bold mb-4 max-w-sm group-hover:text-tertiary dark:group-hover:text-tertiary-container transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-on-surface-variant text-lg mb-6 leading-relaxed">
                      {post.summary}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-tertiary dark:text-tertiary-container">
                        {post.category || "Long Read"}
                      </span>
                      <span className="w-1.5 h-1.5 bg-tertiary/30 rounded-full"></span>
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
                    <div className="flex gap-2 mb-3">
                      <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {post.category}
                      </span>
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
