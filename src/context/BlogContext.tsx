"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Post } from "../types";
import { useAuth } from "./AuthContext";

const API_BASE_URL = "/api";

// Standard API response envelope from the backend
interface APIResponse<T> {
  status: "success" | "failed";
  data: T;
  message: string;
}

interface BlogContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  addPost: (post: Omit<Post, "shares" | "views" | "publishedAt" | "author">) => Promise<Post>;
  updatePost: (post: Post) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  sharePost: (id: string) => Promise<void>;
  viewPost: (id: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

// Helper to parse the standard API response and extract data or throw on failure
async function parseAPIResponse<T>(res: Response): Promise<T> {
  const body = await res.json();

  // Temporary backward-compatibility in case the backend is still running the old code
  // and returning a direct array instead of the { status, data, message } wrapper.
  if (Array.isArray(body)) {
    return body as T;
  }
  // Also handle single post backward compatibility
  if (body && !('status' in body) && 'id' in body) {
    return body as T;
  }

  const apiResponse = body as APIResponse<T>;

  if (!res.ok || apiResponse.status === "failed") {
    throw new Error(apiResponse.message || `Request failed with status ${res.status}`);
  }

  return apiResponse.data;
}

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const { token } = useAuth();

  // Fetch all posts from the API
  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/posts`);
      const data = await parseAPIResponse<Post[]>(res);
      setPosts(data || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
      setPosts([]); // Ensure posts is never undefined on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize: fetch posts and load theme from localStorage
  useEffect(() => {
    setMounted(true);

    // Load theme from localStorage (UI-only preference)
    const savedTheme = localStorage.getItem("kemitbelajar_theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    fetchPosts();
  }, [fetchPosts]);

  const addPost = async (newPostData: Omit<Post, "shares" | "views" | "publishedAt" | "author">): Promise<Post> => {
    const res = await fetch(`${API_BASE_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(newPostData),
    });

    const created = await parseAPIResponse<Post>(res);

    // Refresh posts from server to get consistent state
    await fetchPosts();

    return created;
  };

  const updatePost = async (updatedPost: Post): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/posts/${updatedPost.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updatedPost),
    });

    await parseAPIResponse<Post>(res);

    // Refresh posts from server
    await fetchPosts();
  };

  const deletePost = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    await parseAPIResponse<null>(res);

    // Refresh posts from server
    await fetchPosts();
  };

  const sharePost = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/posts/${id}/share`, {
      method: "POST",
    });

    const updatedPost = await parseAPIResponse<Post>(res);

    // Optimistically update local state
    setPosts((prev) => prev.map((p) => (p.id === id ? updatedPost : p)));
  };

  const viewPost = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/posts/${id}/view`, {
      method: "POST",
    });

    const updatedPost = await parseAPIResponse<Post>(res);

    // Optimistically update local state
    setPosts((prev) => prev.map((p) => (p.id === id ? updatedPost : p)));
  };

  const refreshPosts = async (): Promise<void> => {
    await fetchPosts();
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("kemitbelajar_theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <BlogContext.Provider value={{
      posts: mounted ? posts : [],
      loading,
      error,
      addPost,
      updatePost,
      deletePost,
      sharePost,
      viewPost,
      refreshPosts,
      theme,
      toggleTheme
    }}>
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error("useBlog must be used within a BlogProvider");
  }
  return context;
};
