"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBlog } from "@/context/BlogContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Post } from "@/types";

export default function ArticleDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { posts, sharePost, viewPost } = useBlog();

  const post = posts.find((p) => p.id === id) as Post | undefined;

  const [hasViewed, setHasViewed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height > 0) {
        const scrolled = (winScroll / height) * 100;
        setScrollProgress(scrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (post && !hasViewed) {
      viewPost(post.id).catch((err) => console.error("Failed to track view:", err));
      setHasViewed(true);
    }
  }, [post, hasViewed, viewPost]);

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-on-surface">
        <Header />
        <main className="flex-grow flex items-center justify-center py-24 px-6 max-w-5xl mx-auto">
          <div className="text-center">
            <h2 className="font-headline text-3xl font-bold mb-4">Post Not Found</h2>
            <p className="text-on-surface-variant mb-8">
              The article you are looking for does not exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold cursor-pointer hover:opacity-90"
            >
              Back to Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleShare = async () => {
    if (!post) return;
    
    const url = window.location.href;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.summary,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
      }
      
      // Call backend to increment shares
      await sharePost(post.id);
    } catch (err) {
      console.error("Failed to share:", err);
    }
  };



  // Safe client-side markdown to html parser simulation
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    // Split paragraphs by double newlines
    const blocks = text.split(/\n\s*\n/);

    return blocks.map((block, idx) => {
      const trimmed = block.trim();

      // Heading 1
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-3xl md:text-4xl font-bold font-headline mt-10 mb-4 text-on-surface">
            {trimmed.replace("# ", "")}
          </h1>
        );
      }
      // Heading 2
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-2xl font-bold font-headline mt-10 mb-4 text-on-surface">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      // Heading 3
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xl font-bold font-headline mt-8 mb-3 text-on-surface">
            {trimmed.replace("### ", "")}
          </h3>
        );
      }
      // Blockquote
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote
            key={idx}
            className="border-l-4 border-primary dark:border-primary-fixed-dim pl-6 py-2 my-8 font-headline text-xl text-on-surface-variant italic bg-surface-container/30 rounded-r-lg"
          >
            {trimmed.replace(/^>\s*/gm, "")}
          </blockquote>
        );
      }
      // Image markdown: ![Alt](url)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        return (
          <div key={idx} className="my-10 rounded-xl overflow-hidden shadow-sm">
            <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full h-auto object-cover" />
          </div>
        );
      }
      // Unordered list
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed.split(/\n[*\-]\s+/);
        return (
          <ul key={idx} className="list-disc pl-6 mb-6 space-y-2 text-on-surface-variant leading-relaxed">
            {items.map((item, i) => (
              <li key={i}>{item.replace(/^[*\-]\s+/, "")}</li>
            ))}
          </ul>
        );
      }
      // Ordered list
      if (/^\d+\.\s+/.test(trimmed)) {
        const items = trimmed.split(/\n\d+\.\s+/);
        return (
          <ol key={idx} className="list-decimal pl-6 mb-6 space-y-2 text-on-surface-variant leading-relaxed">
            {items.map((item, i) => (
              <li key={i}>{item.replace(/^\d+\.\s+/, "")}</li>
            ))}
          </ol>
        );
      }

      // Default paragraph (supports inline bold/italic)
      const parsedText = trimmed
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");

      return (
        <p
          key={idx}
          className="text-lg leading-relaxed text-on-surface-variant mb-6"
          dangerouslySetInnerHTML={{ __html: parsedText }}
        />
      );
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface">
      {/* Scroll Progress Indicator */}
      <div
        className="fixed top-0 left-0 height-[3px] bg-primary z-50 transition-all duration-100 ease-out"
        style={{ width: `${scrollProgress}%`, height: "3px" }}
      />

      <Header />

      <main className="flex-grow pb-20">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-6 mt-12 md:mt-20">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-secondary-container text-on-secondary-container rounded-full text-sm font-semibold mb-6">
              <span className="material-symbols-outlined text-sm select-none">
                {post.category?.toLowerCase() === "nature"
                  ? "forest"
                  : post.category?.toLowerCase() === "mindfulness"
                  ? "spa"
                  : "auto_stories"}
              </span>
              {post.category}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-on-surface leading-tight max-w-3xl mb-8 font-headline">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-on-surface-variant font-label">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-12 h-12 rounded-full border-2 border-primary-fixed object-cover"
              />
              <div className="text-left">
                <div className="font-bold text-on-surface">{post.author.name}</div>
                <div className="text-xs">
                  {post.publishedAt} • {post.readTime}
                </div>
              </div>

            </div>
          </div>

          {/* Featured Image */}
          {post.image && (
            <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden shadow-sm mb-16 bg-surface-container-low">
              <img
                src={post.image}
                alt={post.imageAlt || post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          )}
        </div>

        {/* Article Content */}
        <article className="max-w-2xl mx-auto px-6 prose prose-kemitbelajar">
          {renderMarkdown(post.content)}

          {/* Special Static Box for "Julian Thorne" article - Custom design segment */}
          {post.id === "rooted-living" && (
            <div className="my-12 p-8 bg-surface-container rounded-xl flex flex-col md:flex-row items-center gap-8 shadow-sm">
              <div className="flex-grow">
                <h3 className="text-2xl font-bold font-headline mb-3 text-on-surface">
                  Quiet Rituals
                </h3>
                <p className="text-sm text-on-surface-variant mb-0">
                  Discover how small, tactile habits like morning tea or manual journaling can lower cortisol levels and improve long-term focus.
                </p>
              </div>
              <button className="bg-primary text-on-primary dark:bg-primary-container dark:text-on-primary-container px-6 py-3 rounded-lg whitespace-nowrap hover:opacity-90 transition-all shadow-sm cursor-pointer font-bold active:scale-95 duration-150">
                Explore Rituals
              </button>
            </div>
          )}

          {post.id === "rooted-living" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-10">
              <div className="rounded-lg aspect-square overflow-hidden bg-surface-container-high relative">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHq5J5tUgQvK-5IPrvdQpy5tMKBGQ0h6SgyDvhi3edQloYDMY_K8lDHj1H5rBMKy7-PhNOOnA250o8UXdjsV2HsMZ98792X8eOmitIJQSqv30f__Zll65VzW5S3Gp0-gOZ77NRPy1aD5pkeAQZ8omJWOdDHvunJDkOks5rp4Z6RM8Iq2HMzrBqvroGOmqE5EswA39yzAMHOAgKEz_ZwW9gYBXGbwZ4LEP1A8eeExyCfwF8ZYpOAQTH8NaMmfbjuOqK714QwyfQga4"
                  alt="Books and nature"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-lg aspect-square overflow-hidden bg-surface-container-high relative">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCjfbtFoP1ESXzRWfwyVNzd0uC9XwRtN322D8tU9PTtBH47arjxnVcHGLw8Gfyui4BtGKrOd5ZZ3MSEQTVsBT4TvNhAcsUQ6bN4STqPDihTiQTfD1F_SLTHzdiMbk8kiwv05o8Y4GBuyy93wcBO1MfR5jRKjFA6t_amhgo4xL2m0J5uIt9AO8982AUfOrRapncqUVG9ToSY5J9UIf2FSr300LYXajbdZFh9zLsaC7OMeNCuIcq6DOC6YdxkpaKsipJmXr-jdCvDD4"
                  alt="Meditative space"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </article>

        {/* Social Share & Tags */}
        <div className="max-w-2xl mx-auto px-6 mt-16 pt-8 border-t border-outline-variant/30 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-surface-variant text-on-surface-variant rounded-md text-xs font-semibold">
              #{post.category?.toLowerCase().replace(/\s+/g, "-")}
            </span>
            <span className="px-3 py-1 bg-surface-variant text-on-surface-variant rounded-md text-xs font-semibold">
              #slowreading
            </span>
            <span className="px-3 py-1 bg-surface-variant text-on-surface-variant rounded-md text-xs font-semibold">
              #rooted-living
            </span>
          </div>

          <div className="flex items-center gap-4 text-on-surface-variant">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-lg select-none">
                visibility
              </span>
              {post.views?.toLocaleString() || 0} Views
            </span>
            <button
              onClick={handleShare}
              className="hover:text-primary transition-colors flex items-center gap-1.5 font-bold cursor-pointer active:scale-90 duration-150"
            >
              <span className="material-symbols-outlined text-lg select-none">
                share
              </span>
              Share ({post.shares?.toLocaleString() || 0})
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
