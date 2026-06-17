export interface Author {
  name: string;
  avatar: string;
  role: string;
}

export interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  author: Author;
  readTime: string;
  publishedAt: string;
  image: string;
  imageAlt: string;
  shares: number;
  views: number;
  isFeatured?: boolean;
  status: "published" | "draft";
}
