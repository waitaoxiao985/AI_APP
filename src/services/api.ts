const API_BASE_URL = 'http://localhost:3003/api';

interface User {
  id: string;
  email: string;
  name: string;
  title?: string;
}

interface Article {
  id: string;
  title: string;
  description?: string;
  content: string;
  category_id?: string;
  image_url?: string;
  read_time?: string;
  tag?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  count: number;
  created_at: string;
  updated_at: string;
}

interface Bookmark {
  id: string;
  article_id: string;
  created_at: string;
  articles?: {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
    read_time?: string;
    tag?: string;
  };
}

interface Progress {
  id: string;
  article_id: string;
  progress: number;
  last_read: string;
  articles?: {
    id: string;
    title: string;
    description?: string;
  };
}

interface UserPreferences {
  id: string;
  user_id: string;
  language: string;
  notifications_enabled: boolean;
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return response.json();
  }

  // Auth methods
  async register(email: string, password: string, name: string, title?: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, title }),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('token', response.token);
    }

    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('token', response.token);
    }

    return response;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Article methods
  async getArticles(category?: string, limit: number = 10, offset: number = 0): Promise<{ articles: Article[] }> {
    let queryParams = `?limit=${limit}&offset=${offset}`;
    if (category) {
      queryParams += `&category=${category}`;
    }
    return this.request<{ articles: Article[] }>(`/articles${queryParams}`);
  }

  async getArticleById(id: string): Promise<{ article: Article }> {
    return this.request<{ article: Article }>(`/articles/${id}`);
  }

  async searchArticles(query: string): Promise<{ articles: Article[] }> {
    return this.request<{ articles: Article[] }>(`/articles/search?q=${encodeURIComponent(query)}`);
  }

  async createArticle(article: Omit<Article, 'id' | 'created_at' | 'updated_at'>): Promise<{ article: Article }> {
    return this.request<{ article: Article }>('/articles', {
      method: 'POST',
      body: JSON.stringify(article),
    });
  }

  async updateArticle(id: string, article: Partial<Article>): Promise<{ article: Article }> {
    return this.request<{ article: Article }>(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(article),
    });
  }

  async deleteArticle(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/articles/${id}`, {
      method: 'DELETE',
    });
  }

  // Category methods
  async getCategories(): Promise<{ categories: Category[] }> {
    return this.request<{ categories: Category[] }>('/categories');
  }

  async getCategoryById(id: string): Promise<{ category: Category }> {
    return this.request<{ category: Category }>(`/categories/${id}`);
  }

  // User methods
  async getUserProfile(): Promise<{ user: User; preferences: UserPreferences }> {
    return this.request<{ user: User; preferences: UserPreferences }>('/users/profile');
  }

  async updateUserProfile(name: string, title?: string): Promise<{ user: User }> {
    return this.request<{ user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, title }),
    });
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<{ preferences: UserPreferences }> {
    return this.request<{ preferences: UserPreferences }>('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Bookmark methods
  async getBookmarks(): Promise<{ bookmarks: Bookmark[] }> {
    return this.request<{ bookmarks: Bookmark[] }>('/users/bookmarks');
  }

  async addBookmark(article_id: string): Promise<{ bookmark: Bookmark }> {
    return this.request<{ bookmark: Bookmark }>('/users/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ article_id }),
    });
  }

  async removeBookmark(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/users/bookmarks/${id}`, {
      method: 'DELETE',
    });
  }

  // Progress methods
  async getProgress(): Promise<{ progress: Progress[] }> {
    return this.request<{ progress: Progress[] }>('/users/progress');
  }

  async updateProgress(article_id: string, progress: number): Promise<{ progress: Progress }> {
    return this.request<{ progress: Progress }>('/users/progress', {
      method: 'POST',
      body: JSON.stringify({ article_id, progress }),
    });
  }

  // Admin methods
  async adminLogin(username: string, password: string): Promise<{ token: string }> {
    const response = await this.request<{ token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('token', response.token);
    }

    return response;
  }
}

export const api = new ApiService();
export type { User, Article, Category, Bookmark, Progress, UserPreferences };