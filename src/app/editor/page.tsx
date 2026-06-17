"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useBlog } from "@/context/BlogContext";
import { useAuth } from "@/context/AuthContext";
import { Post } from "@/types";

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { posts, addPost, updatePost, deletePost } = useBlog();
  const { user, loading: authLoading, logout, token } = useAuth();

  const editId = searchParams.get("id");
  const [activeView, setActiveView] = useState<"editor" | "list" | "analytics" | "settings">("editor");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentEditId, setCurrentEditId] = useState<string | null>(editId);

  // Form states
  const [title, setTitle] = useState("The Art of Mindful Cultivation");
  const [category, setCategory] = useState("Philosophy");
  const [content, setContent] = useState(
    `Mindfulness isn't just a practice of the mind; it is a physical anchoring to the earth beneath our feet. When we talk about "rooted warmth," we refer to that specific sensation of being fully present in a space that nurtures our growth.

## The Soil of Creativity

Just as a forest thrives on the invisible network of mycelium, our ideas require a rich substrate of rest and observation. 

> "Nature does not hurry, yet everything is accomplished." — Lao Tzu

In this editor, we strip away the noise of the digital world. No notifications, no clutter—just you and the rhythmic dance of the cursor.

### Key Practices:
1. **Breathe with the sentence**: Let the length of your thoughts match the rhythm of your breath.
2. **Observe the light**: Notice how the sun shifts across your desk as you write.
3. **Listen to the silence**: The gaps between words are as important as the words themselves.

![Forest Morning](https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800)

The image above represents the clarity we seek in our prose. Deep greens, soft morning light, and a path that reveals itself only as we take the next step.`
  );

  // UI States
  const [showPreview, setShowPreview] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // User Management State
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "Author" });
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  
  const isAdmin = user?.role === "Admin" || user?.role === "Senior Editor";

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Fetch system users when opening settings
  useEffect(() => {
    if (activeView === "settings" && token) {
      fetch("/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(data => {
        if (data.status === "success") {
          setSystemUsers(data.data);
        }
      })
      .catch(err => console.error("Failed to load users", err));
    }
  }, [activeView, token]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");
    setIsAddingUser(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      
      if (!res.ok || data.status === "failed") {
        throw new Error(data.message || "Failed to create user");
      }
      
      setUserSuccess("User created successfully!");
      setNewUser({ name: "", username: "", password: "", role: "Author" });
      setShowAddUserDialog(false);
      
      // Reload users
      const usersRes = await fetch("/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersData.status === "success") {
        setSystemUsers(usersData.data);
      }
    } catch (err: any) {
      setUserError(err.message);
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserError("");
    setUserSuccess("");
    setIsUpdatingUser(true);

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingUser.name,
          username: editingUser.username,
          role: editingUser.role
        })
      });
      const data = await res.json();
      
      if (!res.ok || data.status === "failed") {
        throw new Error(data.message || "Failed to update user");
      }
      
      setUserSuccess("User updated successfully!");
      setEditingUser(null);
      
      // Reload users
      const usersRes = await fetch("/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersData.status === "success") {
        setSystemUsers(usersData.data);
      }
    } catch (err: any) {
      setUserError(err.message);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    setUserError("");
    setUserSuccess("");
    setIsDeletingUser(id);

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (!res.ok || data.status === "failed") {
        throw new Error(data.message || "Failed to delete user");
      }
      
      setUserSuccess("User deleted successfully!");
      
      // Reload users
      setSystemUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      setUserError(err.message);
    } finally {
      setIsDeletingUser(null);
    }
  };

  // Load existing post if query parameter id is present
  useEffect(() => {
    const targetId = currentEditId || editId;
    if (targetId) {
      const existing = posts.find((p) => p.id === targetId);
      if (existing) {
        Promise.resolve().then(() => {
          setTitle(existing.title);
          setCategory(existing.category);
          setContent(existing.content);
          setIsEditing(true);
          setCurrentEditId(targetId);
          setActiveView("editor");
        });
      }
    }
  }, [editId, currentEditId, posts]);

  // Handle document format toolbar actions (Bold, Italic, link, image, quote, list)
  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = textarea.value.substring(start, end);
    const replacement = before + (selection || "text") + after;

    const newValue =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    setContent(newValue);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + (selection || "text").length
      );
    }, 0);
  };

  // Simple Markdown Parser (Simulation from design spec)
  const parseMarkdown = (text: string) => {
    if (!text) return "";

    const html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold font-headline mt-8 mb-3 text-on-surface">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold font-headline mt-10 mb-4 text-on-surface">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold font-headline mt-12 mb-5 text-on-surface">$1</h1>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic my-6 text-on-surface-variant bg-surface-container/20 py-2 rounded-r">$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="my-8 rounded-xl overflow-hidden shadow-sm bg-surface-container-high"><img src="$2" alt="$1" class="w-full h-auto" /></div>')
      .replace(/^\d+\.\s+(.*$)/gim, '<li class="ml-4 list-decimal my-1">$1</li>')
      .replace(/^\-\s+(.*$)/gim, '<li class="ml-4 list-disc my-1">$1</li>');

    // Wrap plain paragraphs
    return html
      .split("\n\n")
      .map((p) => {
        const trimmed = p.trim();
        if (!trimmed) return "";
        if (
          trimmed.startsWith("<h") ||
          trimmed.startsWith("<blockquote") ||
          trimmed.startsWith("<div") ||
          trimmed.startsWith("<li")
        ) {
          return trimmed;
        }
        return `<p class="mb-4 leading-relaxed text-on-surface-variant">${trimmed.replace(/\n/g, "<br/>")}</p>`;
      })
      .join("");
  };

  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    try {
      if (isEditing && currentEditId) {
        const existing = posts.find((p) => p.id === currentEditId);
        if (existing) {
          await updatePost({
            ...existing,
            title,
            category,
            content,
            summary: content.substring(0, 150).replace(/[#>*\-]/g, "").trim() + "...",
            readTime: calculateReadTime(content),
            status: "published"
          });
          alert("Post published successfully!");
          setActiveView("list");
        }
      } else {
        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

        let finalSlug = slug || "untitled-post";
        let counter = 1;
        while (posts.some((p) => p.id === finalSlug)) {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }

        await addPost({
          id: finalSlug,
          title,
          category,
          content,
          summary: content.substring(0, 150).replace(/[#>*\-]/g, "").trim() + "...",
          readTime: calculateReadTime(content),
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdjeGIbDgGh1BZIIb0bocdNMrzDLkeaYFtBaqNnff3Ib1TlZmOFgyNu1MsRLEH_3pXD_rkFm3gnBHd1dpcJKttGm5wYZhErVi109nnpZkWKv4vHWFkce4GrgIxsnCR966qpRyhJLJoV7PoXJV45GazHAc4E5rcx8cu8cPcsDznf3mf6p-R1VIfOVmL0cv8ADHdgcl2NRI_mgYjGd85ZcFF3tBFqJ2y2O4dI9Bedw7NvzXMJJSma3ZmouCReUD0q1p-B_hXSjiNtJ0",
          imageAlt: "A beautiful exploration scene.",
          status: "published"
        });
        alert("Post published successfully!");
        setActiveView("list");
      }
    } catch (err) {
      alert("Failed to publish post. Please try again.");
      console.error(err);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    try {
      if (isEditing && currentEditId) {
        const existing = posts.find((p) => p.id === currentEditId);
        if (existing) {
          await updatePost({
            ...existing,
            title,
            category,
            content,
            summary: content.substring(0, 150).replace(/[#>*\-]/g, "").trim() + "...",
            readTime: calculateReadTime(content),
            status: "draft"
          });
          alert("Draft saved successfully!");
          setActiveView("list");
        }
      } else {
        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

        let finalSlug = slug || "untitled-draft";
        let counter = 1;
        while (posts.some((p) => p.id === finalSlug)) {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }

        await addPost({
          id: finalSlug,
          title,
          category,
          content,
          summary: content.substring(0, 150).replace(/[#>*\-]/g, "").trim() + "...",
          readTime: calculateReadTime(content),
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdjeGIbDgGh1BZIIb0bocdNMrzDLkeaYFtBaqNnff3Ib1TlZmOFgyNu1MsRLEH_3pXD_rkFm3gnBHd1dpcJKttGm5wYZhErVi109nnpZkWKv4vHWFkce4GrgIxsnCR966qpRyhJLJoV7PoXJV45GazHAc4E5rcx8cu8cPcsDznf3mf6p-R1VIfOVmL0cv8ADHdgcl2NRI_mgYjGd85ZcFF3tBFqJ2y2O4dI9Bedw7NvzXMJJSma3ZmouCReUD0q1p-B_hXSjiNtJ0",
          imageAlt: "A beautiful exploration scene.",
          status: "draft"
        });
        alert("Draft saved successfully!");
        setActiveView("list");
      }
    } catch (err) {
      alert("Failed to save draft. Please try again.");
      console.error(err);
    }
  };

  const handleNewPostClick = () => {
    setTitle("");
    setCategory("Philosophy");
    setContent("");
    setIsEditing(false);
    setCurrentEditId(null);
    setActiveView("editor");
    router.push("/editor");
  };

  const handleToggleStatus = async (post: Post) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    try {
      await updatePost({
        ...post,
        status: newStatus
      });
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleEditPost = (post: Post) => {
    setTitle(post.title);
    setCategory(post.category);
    setContent(post.content);
    setIsEditing(true);
    setCurrentEditId(post.id);
    setActiveView("editor");
  };

  const handleDeletePost = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await deletePost(id);
      } catch (err) {
        alert("Failed to delete post.");
        console.error(err);
      }
    }
  };

  const filteredPostsList = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarContent = (
    <div className="flex flex-col h-full gap-2 p-4">
      <div className="flex flex-col gap-1 mb-8 px-2">
        <div className="font-headline text-xl text-primary dark:text-primary-fixed-dim font-bold flex items-center gap-2 select-none">
          Creator Studio
        </div>
        <div className="font-body text-xs text-on-surface-variant">
          Managing Kemitbelajar Blog
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant/10 rounded-lg transition-all duration-200 ease-in-out"
        >
          <span className="material-symbols-outlined text-xl select-none">article</span>
          <span className="font-body font-semibold">Feed</span>
        </Link>
        
        <button
          onClick={() => {
            setActiveView("editor");
            setMobileSidebarOpen(false);
          }}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out text-left cursor-pointer w-full ${
            activeView === "editor"
              ? "bg-primary-container text-on-primary-container dark:bg-primary-container/20 dark:text-primary-fixed-dim font-bold"
              : "text-on-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant/10"
          }`}
        >
          <span
            className="material-symbols-outlined text-xl select-none"
            style={{ fontVariationSettings: activeView === "editor" ? "'FILL' 1" : undefined }}
          >
            edit_note
          </span>
          <span className="font-body">Write Post</span>
        </button>

        <button
          onClick={() => {
            setActiveView("list");
            setMobileSidebarOpen(false);
          }}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out text-left cursor-pointer w-full ${
            activeView === "list"
              ? "bg-primary-container text-on-primary-container dark:bg-primary-container/20 dark:text-primary-fixed-dim font-bold"
              : "text-on-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant/10"
          }`}
        >
          <span
            className="material-symbols-outlined text-xl select-none"
            style={{ fontVariationSettings: activeView === "list" ? "'FILL' 1" : undefined }}
          >
            format_list_bulleted
          </span>
          <span className="font-body">Content List</span>
        </button>

        <button
          onClick={() => {
            setActiveView("analytics");
            setMobileSidebarOpen(false);
          }}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out text-left cursor-pointer w-full ${
            activeView === "analytics"
              ? "bg-primary-container text-on-primary-container dark:bg-primary-container/20 dark:text-primary-fixed-dim font-bold"
              : "text-on-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant/10"
          }`}
        >
          <span
            className="material-symbols-outlined text-xl select-none"
            style={{ fontVariationSettings: activeView === "analytics" ? "'FILL' 1" : undefined }}
          >
            bar_chart
          </span>
          <span className="font-body">Analytics</span>
        </button>

        <button
          onClick={() => {
            setActiveView("settings");
            setMobileSidebarOpen(false);
          }}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out text-left cursor-pointer w-full ${
            activeView === "settings"
              ? "bg-primary-container text-on-primary-container dark:bg-primary-container/20 dark:text-primary-fixed-dim font-bold"
              : "text-on-surface-variant hover:bg-surface-variant dark:hover:bg-on-surface-variant/10"
          }`}
        >
          <span
            className="material-symbols-outlined text-xl select-none"
            style={{ fontVariationSettings: activeView === "settings" ? "'FILL' 1" : undefined }}
          >
            settings
          </span>
          <span className="font-body">Settings</span>
        </button>
      </nav>

      <div className="mt-auto p-2">
        <div className="flex items-center gap-3 mb-6 p-2 rounded-lg bg-surface-container-high">
          <img
            alt={user?.name || "Profile"}
            className="w-10 h-10 rounded-full object-cover border border-outline-variant/30"
            src={user?.avatar || "https://ui-avatars.com/api/?name=User"}
          />
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-bold truncate">{user?.name || "Loading..."}</p>
            <p className="text-xs text-on-surface-variant">{user?.role || "Editor"}</p>
          </div>
          <button onClick={logout} className="p-2 hover:bg-surface-variant rounded-full transition-colors text-error" title="Sign Out">
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
        {activeView === "editor" && (
          <button
            onClick={handlePublish}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            Publish Now
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-background text-on-surface flex min-h-screen relative w-full overflow-hidden">
      {/* Mobile Sidebar Slide-over drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative flex w-full max-w-xs flex-col bg-surface-container-low h-full shadow-lg">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-full hover:bg-surface-variant cursor-pointer text-on-surface-variant"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar (Shared Components JSON design spec) */}
      <aside className="h-screen w-64 rounded-r-xl bg-surface-container-low dark:bg-surface-container shadow-sm hidden md:flex flex-col sticky top-0 border-r border-outline-variant/10 shrink-0">
        {sidebarContent}
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Editor Header (Contextual Actions) */}
        <header className="flex items-center justify-between px-6 md:px-8 py-4 bg-background/80 backdrop-blur-md z-10 border-b border-outline-variant/10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer md:hidden text-on-surface-variant flex items-center justify-center"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              {activeView === "list"
                ? "Content Manager"
                : activeView === "analytics"
                ? "Analytics Dashboard"
                : activeView === "settings"
                ? "Studio Settings"
                : isEditing
                ? "Edit Post"
                : "New Post"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {activeView === "editor" ? (
              <>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-full transition-all cursor-pointer select-none"
                >
                  <span className="material-symbols-outlined text-lg">auto_stories</span>
                  <span className="hidden sm:inline">
                    {showPreview ? "Focused Mode" : "Split View"}
                  </span>
                </button>
                <div className="h-6 w-px bg-outline-variant/30 mx-2"></div>
                <button
                  onClick={handleSaveDraft}
                  className="px-6 py-2 bg-secondary-container text-on-secondary-container rounded-full text-sm font-bold hover:bg-surface-variant transition-colors cursor-pointer active:scale-95 duration-100"
                >
                  Save Draft
                </button>
                <button
                  onClick={handlePublish}
                  className="px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  Publish
                </button>
              </>
            ) : (
              <button
                onClick={handleNewPostClick}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>New Post</span>
              </button>
            )}
          </div>
        </header>

        {/* Workspace Canvas */}
        <div className="flex-1 flex overflow-hidden w-full bg-background" id="workspace">
          {activeView === "editor" ? (
            <>
              {/* Markdown Input */}
              <section
                className="flex-1 overflow-y-auto px-6 md:px-12 py-10 border-r border-outline-variant/10 transition-all duration-300"
                id="editor-pane"
              >
                <div className="max-w-2xl mx-auto flex flex-col gap-6 h-full">
                  <input
                    className="font-headline text-3xl md:text-4xl font-bold bg-transparent border-none outline-none focus:ring-0 placeholder-on-surface-variant/30 text-on-surface w-full p-1"
                    placeholder="Entry Title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant/60 font-label border-b border-outline-variant/20 pb-4">
                    <span className="flex items-center gap-1.5 select-none">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      Today
                    </span>
                    <span className="flex items-center gap-1.5 select-none">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {calculateReadTime(content)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm select-none">tag</span>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-transparent border-none outline-none py-0 pl-1 pr-6 font-semibold text-sm text-on-surface-variant/80 focus:ring-0 cursor-pointer focus:outline-none"
                      >
                        <option value="Philosophy" className="bg-background">Philosophy</option>
                        <option value="Mindfulness" className="bg-background">Mindfulness</option>
                        <option value="Nature" className="bg-background">Nature</option>
                        <option value="Sustainability" className="bg-background">Sustainability</option>
                        <option value="Writing" className="bg-background">Writing</option>
                        <option value="Manual Craftsmanship" className="bg-background">Manual Craftsmanship</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    ref={textareaRef}
                    className="editor-textarea font-body text-lg leading-relaxed text-on-surface w-full h-[600px] md:h-[calc(100vh-320px)] placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none p-1"
                    placeholder="Begin your journey here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </section>

              {/* Preview Pane (Toggleable) */}
              {showPreview && (
                <section
                  className="flex-1 overflow-y-auto px-6 md:px-12 py-10 bg-surface-container-lowest border-l border-outline-variant/10 hidden md:block"
                  id="preview-pane"
                >
                  <article className="max-w-2xl mx-auto prose prose-kemitbelajar">
                    <h1 className="text-4xl font-bold font-headline mb-6 text-on-surface leading-tight">
                      {title || "Untitled Document"}
                    </h1>
                    <div
                      className="font-body text-lg text-on-surface-variant leading-relaxed space-y-6"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
                    />
                  </article>
                </section>
              )}
            </>
          ) : activeView === "list" ? (
            /* Content List Pane */
            <section className="flex-1 overflow-y-auto px-6 md:px-12 py-10 bg-background" id="content-list-pane">
              <div className="max-w-4xl mx-auto flex flex-col gap-6">
                {/* Heading and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
                  <div>
                    <h1 className="font-headline text-3xl font-bold text-on-surface mb-2">
                      Manage Content
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                      View, edit, delete, or change the publishing status of your posts and drafts.
                    </p>
                  </div>

                  {/* Search input */}
                  <div className="relative max-w-xs w-full flex items-center">
                    <span className="material-symbols-outlined text-on-surface-variant absolute left-3 select-none pointer-events-none text-xl">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search title or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-outline-variant/50 bg-surface-container-low text-on-surface text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Content Table / Card List */}
                <div className="w-full">
                  {filteredPostsList.length === 0 ? (
                    <div className="text-center py-12 text-on-surface-variant italic bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
                      No posts or drafts found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-outline-variant/20 shadow-sm bg-surface-container-lowest">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-surface-container-low text-on-surface-variant font-semibold">
                          <tr>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Published</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {filteredPostsList.map((post) => (
                            <tr key={post.id} className="hover:bg-surface-container-low/40 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-on-surface hover:text-primary cursor-pointer line-clamp-1" onClick={() => handleEditPost(post)}>
                                  {post.title}
                                </div>
                                <div className="text-xs text-on-surface-variant/80 mt-0.5 max-w-md truncate">
                                  {post.summary}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-container">
                                  {post.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {post.status === "published" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Published
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Draft
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">
                                {post.publishedAt}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                  {/* Toggle Status Button */}
                                  <button
                                    onClick={() => handleToggleStatus(post)}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-variant dark:hover:bg-on-surface-variant/10 transition-all cursor-pointer"
                                    title={post.status === "published" ? "Revert to Draft" : "Publish Now"}
                                  >
                                    <span className="material-symbols-outlined text-lg select-none">
                                      {post.status === "published" ? "unpublished" : "publish"}
                                    </span>
                                  </button>
                                  {/* Edit Button */}
                                  <button
                                    onClick={() => handleEditPost(post)}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-variant dark:hover:bg-on-surface-variant/10 transition-all cursor-pointer"
                                    title="Edit Post"
                                  >
                                    <span className="material-symbols-outlined text-lg select-none">edit</span>
                                  </button>
                                  {/* Delete Button */}
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                                    title="Delete Post"
                                  >
                                    <span className="material-symbols-outlined text-lg select-none">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : activeView === "analytics" ? (
            /* Analytics Pane */
            <section className="flex-1 overflow-y-auto px-6 md:px-12 py-10 bg-background" id="analytics-pane">
              <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <div className="border-b border-outline-variant/20 pb-6">
                  <h1 className="font-headline text-3xl font-bold text-on-surface mb-2">
                    Performance Analytics
                  </h1>
                  <p className="text-sm text-on-surface-variant">
                    Track views and shares for your published content.
                  </p>
                </div>

                {/* Overall Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-outline-variant/20">
                    <h3 className="text-sm font-bold text-on-surface-variant mb-2">Total Views</h3>
                    <p className="text-4xl font-headline font-bold text-primary">
                      {posts.reduce((sum, p) => sum + (p.views || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-outline-variant/20">
                    <h3 className="text-sm font-bold text-on-surface-variant mb-2">Total Shares</h3>
                    <p className="text-4xl font-headline font-bold text-secondary">
                      {posts.reduce((sum, p) => sum + (p.shares || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-outline-variant/20">
                    <h3 className="text-sm font-bold text-on-surface-variant mb-2">Published Posts</h3>
                    <p className="text-4xl font-headline font-bold text-tertiary">
                      {posts.filter((p) => p.status === "published").length}
                    </p>
                  </div>
                </div>

                {/* Content Table for Analytics */}
                <div className="w-full">
                  <div className="overflow-x-auto rounded-xl border border-outline-variant/20 shadow-sm bg-surface-container-lowest">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-surface-container-low text-on-surface-variant font-semibold">
                        <tr>
                          <th className="px-6 py-4">Title</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4 text-right">Views</th>
                          <th className="px-6 py-4 text-right">Shares</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {posts
                          .filter((p) => p.status === "published")
                          .sort((a, b) => (b.views || 0) - (a.views || 0))
                          .map((post) => (
                          <tr key={post.id} className="hover:bg-surface-container-low/40 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-on-surface line-clamp-1">
                                {post.title}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-on-surface-variant">
                              {post.category}
                            </td>
                            <td className="px-6 py-4 font-bold text-right text-primary">
                              {post.views?.toLocaleString() || 0}
                            </td>
                            <td className="px-6 py-4 font-bold text-right text-secondary">
                              {post.shares?.toLocaleString() || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          ) : activeView === "settings" ? (
            /* Settings Pane (User Management) */
            <section className="flex-1 overflow-y-auto px-6 md:px-12 py-10 bg-background relative" id="settings-pane">
              <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <div className="border-b border-outline-variant/20 pb-6 flex justify-between items-end gap-4">
                  <div>
                    <h1 className="font-headline text-3xl font-bold text-on-surface mb-2">
                      Studio Settings
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                      Manage studio access and author accounts.
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setUserError("");
                        setUserSuccess("");
                        setShowAddUserDialog(true);
                      }}
                      className="bg-primary text-on-primary px-4 py-2.5 rounded-lg font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all text-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">person_add</span>
                      <span>Add User</span>
                    </button>
                  )}
                </div>

                <div className="w-full">
                  {/* Users List */}
                  <div>
                    <div className="overflow-x-auto rounded-xl border border-outline-variant/20 shadow-sm bg-surface-container-lowest">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-surface-container-low text-on-surface-variant font-semibold">
                          <tr>
                            <th className="px-6 py-4 w-1/3">Name</th>
                            <th className="px-6 py-4 w-1/3">Username</th>
                            <th className="px-6 py-4 w-1/4">Role</th>
                            {isAdmin && <th className="px-6 py-4 w-1/12 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {systemUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors">
                              <td className="px-6 py-4 font-bold text-on-surface">
                                <div className="flex items-center gap-3">
                                  <img src={u.avatar || "https://ui-avatars.com/api/?name=User"} alt={u.name} className="w-8 h-8 rounded-full border border-outline-variant/30 object-cover" />
                                  {u.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-on-surface-variant">{u.username}</td>
                              <td className="px-6 py-4">
                                <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-xs font-bold inline-block">
                                  {u.role}
                                </span>
                              </td>
                              {isAdmin && (
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingUser({...u});
                                        setUserError("");
                                        setUserSuccess("");
                                      }}
                                      className="text-on-surface-variant hover:text-primary p-1.5 rounded-full hover:bg-surface-variant transition-colors"
                                      title="Edit User"
                                    >
                                      <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    {user?.id !== u.id && (
                                      <button
                                        onClick={() => handleDeleteUser(u.id)}
                                        disabled={isDeletingUser === u.id}
                                        className="text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-error-container transition-colors disabled:opacity-50"
                                        title="Delete User"
                                      >
                                        <span className="material-symbols-outlined text-lg">
                                          {isDeletingUser === u.id ? 'pending' : 'delete'}
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                          {systemUsers.length === 0 && (
                            <tr>
                              <td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-on-surface-variant italic">
                                Loading users...
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add User Dialog Overlay */}
              {showAddUserDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                  <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container-low">
                      <h3 className="text-xl font-bold font-headline text-on-surface">Add New User</h3>
                      <button 
                        onClick={() => setShowAddUserDialog(false)} 
                        className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xl select-none">close</span>
                      </button>
                    </div>
                    <div className="p-6">
                      <form onSubmit={handleCreateUser} className="flex flex-col gap-5">
                        {userError && (
                          <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm font-semibold flex items-start gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            <span>{userError}</span>
                          </div>
                        )}
                        {userSuccess && (
                          <div className="bg-primary-container text-on-primary-container p-3 rounded-lg text-sm font-semibold flex items-start gap-2">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            <span>{userSuccess}</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Full Name</label>
                          <input
                            type="text"
                            required
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                            className="px-4 py-3 bg-background border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                            placeholder="e.g. Jane Doe"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Username</label>
                          <input
                            type="text"
                            required
                            value={newUser.username}
                            onChange={e => setNewUser({...newUser, username: e.target.value})}
                            className="px-4 py-3 bg-background border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                            placeholder="e.g. jane"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Role</label>
                          <div className="relative">
                            <select
                              value={newUser.role}
                              onChange={e => setNewUser({...newUser, role: e.target.value})}
                              className="w-full px-4 py-3 bg-background border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all appearance-none cursor-pointer"
                            >
                              <option value="Author">Author</option>
                              <option value="Admin">Admin</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-3.5 text-on-surface-variant pointer-events-none">expand_more</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Password</label>
                          <input
                            type="password"
                            required
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                            className="px-4 py-3 bg-background border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            onClick={() => setShowAddUserDialog(false)}
                            className="flex-1 px-4 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-variant transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isAddingUser}
                            className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 transition-all text-sm flex justify-center items-center gap-2 shadow-sm"
                          >
                            {isAddingUser ? (
                              <span className="material-symbols-outlined animate-spin text-lg">autorenew</span>
                            ) : (
                              "Create User"
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit User Dialog Overlay */}
              {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                  <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container-low">
                      <h3 className="text-xl font-bold font-headline text-on-surface">Edit User</h3>
                      <button 
                        onClick={() => setEditingUser(null)} 
                        className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xl select-none">close</span>
                      </button>
                    </div>
                    <div className="p-6">
                      <form onSubmit={handleUpdateUser} className="flex flex-col gap-5">
                        {userError && (
                          <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm font-semibold flex items-start gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            <span>{userError}</span>
                          </div>
                        )}
                        {userSuccess && (
                          <div className="bg-primary-container text-on-primary-container p-3 rounded-lg text-sm font-semibold flex items-start gap-2">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            <span>{userSuccess}</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Full Name</label>
                          <input
                            type="text"
                            required
                            value={editingUser.name}
                            onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                            className="px-4 py-3 bg-background border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                            placeholder="e.g. Jane Doe"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Username</label>
                          <input
                            type="text"
                            required
                            value={editingUser.username}
                            onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                            className="px-4 py-3 bg-background border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                            placeholder="e.g. jane"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Role</label>
                          <div className="relative">
                            <select
                              value={editingUser.role}
                              onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                              className="w-full px-4 py-3 bg-background border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all appearance-none cursor-pointer"
                            >
                              <option value="Author">Author</option>
                              <option value="Admin">Admin</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-3.5 text-on-surface-variant pointer-events-none">expand_more</span>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingUser(null)}
                            className="flex-1 px-4 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-variant transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isUpdatingUser}
                            className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 transition-all text-sm flex justify-center items-center gap-2 shadow-sm"
                          >
                            {isUpdatingUser ? (
                              <span className="material-symbols-outlined animate-spin text-lg">autorenew</span>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </section>
          ) : null}
        </div>

        {/* Editor Toolbar (Bottom Anchor) */}
        {activeView === "editor" && (
          <footer className="p-4 bg-surface-container-low flex justify-center gap-2 border-t border-outline-variant/20 shrink-0">
            <div className="flex bg-surface rounded-full p-1 shadow-sm border border-outline-variant/30">
              <button
                onClick={() => insertText("\n# ", "\n")}
                className="w-9 h-9 hover:bg-surface-variant rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface flex items-center justify-center font-bold text-xs select-none font-headline"
                title="Heading 1"
              >
                H1
              </button>
              <button
                onClick={() => insertText("\n## ", "\n")}
                className="w-9 h-9 hover:bg-surface-variant rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface flex items-center justify-center font-bold text-xs select-none font-headline"
                title="Heading 2"
              >
                H2
              </button>
              <button
                onClick={() => insertText("\n### ", "\n")}
                className="w-9 h-9 hover:bg-surface-variant rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface flex items-center justify-center font-bold text-xs select-none font-headline"
                title="Heading 3"
              >
                H3
              </button>
              <div className="w-px h-6 bg-outline-variant/30 my-auto mx-1"></div>
              <button
                onClick={() => insertText("**", "**")}
                className="p-2 hover:bg-surface-variant rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface flex items-center justify-center"
                title="Bold"
              >
                <span className="material-symbols-outlined text-lg select-none">format_bold</span>
              </button>
              <button
                onClick={() => insertText("*", "*")}
                className="p-2 hover:bg-surface-variant rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface flex items-center justify-center"
                title="Italic"
              >
                <span className="material-symbols-outlined text-lg select-none">format_italic</span>
              </button>
              <button
                onClick={() => insertText("[", "](https://)")}
                className="p-2 hover:bg-surface-variant rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface flex items-center justify-center"
                title="Link"
              >
                <span className="material-symbols-outlined text-lg select-none">link</span>
              </button>
              <div className="w-px h-6 bg-outline-variant/30 my-auto mx-1"></div>
              <button
                onClick={() => insertText("![", "](https://images.unsplash.com/photo-1441974231531-c6227db76b6e)")}
                className="p-2 hover:bg-surface-variant rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface flex items-center justify-center"
                title="Image"
              >
                <span className="material-symbols-outlined text-lg select-none">image</span>
              </button>
              <button
                onClick={() => insertText("\n> ", "\n")}
                className="p-2 hover:bg-surface-variant rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface flex items-center justify-center"
                title="Quote"
              >
                <span className="material-symbols-outlined text-lg select-none">format_quote</span>
              </button>
              <button
                onClick={() => insertText("\n- ", "\n")}
                className="p-2 hover:bg-surface-variant rounded-full transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface flex items-center justify-center"
                title="List"
              >
                <span className="material-symbols-outlined text-lg select-none">format_list_bulleted</span>
              </button>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}

export default function ContentEditor() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-on-surface-variant font-headline min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">
              sync
            </span>
            <span>Loading Creator Studio...</span>
          </div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
