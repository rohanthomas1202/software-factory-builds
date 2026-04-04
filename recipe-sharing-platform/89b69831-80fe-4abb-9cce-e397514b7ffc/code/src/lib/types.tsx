export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
  updatedAt: string;
  stats: {
    recipeCount: number;
    commentCount: number;
    averageRating: number;
    followers: number;
    following: number;
  };
  preferences: {
    emailNotifications: boolean;
    publicProfile: boolean;
    defaultPrivacy: 'public' | 'private' | 'followers';
  };
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: RecipeStep[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  tags: string[];
  images: string[];
  authorId: string;
  author?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  status: 'draft' | 'published' | 'pending_review' | 'archived';
  visibility: 'public' | 'private' | 'followers';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  stats: {
    views: number;
    saves: number;
    commentsCount: number;
    averageRating: number;
    ratingCount: number;
  };
  nutrition?: NutritionInfo;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

export interface RecipeStep {
  id: string;
  order: number;
  description: string;
  imageUrl?: string;
  timer?: number; // in minutes
}

export interface NutritionInfo {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  fiber?: number; // in grams
  sugar?: number; // in grams
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  recipeId: string;
  parentId?: string;
  replies?: Comment[];
  rating?: number;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  status: 'active' | 'flagged' | 'hidden' | 'deleted';
}

export interface Rating {
  id: string;
  userId: string;
  recipeId: string;
  value: number; // 1-5
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  recipeCount: number;
  parentId?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  recipeCount: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'comment' | 'reply' | 'like' | 'follow' | 'recipe_approved' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'recipe' | 'comment' | 'user';
  targetId: string;
  reason: 'spam' | 'inappropriate' | 'copyright' | 'harassment' | 'other';
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  recipeId: string;
  folder?: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface RecipeFilters {
  search?: string;
  cuisine?: string[];
  difficulty?: ('easy' | 'medium' | 'hard')[];
  prepTime?: {
    min?: number;
    max?: number;
  };
  cookTime?: {
    min?: number;
    max?: number;
  };
  servings?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  authorId?: string;
  status?: ('draft' | 'published' | 'pending_review' | 'archived')[];
  visibility?: ('public' | 'private' | 'followers')[];
  minRating?: number;
  createdAfter?: string;
  createdBefore?: string;
}

export type RecipeSortOption = 
  | 'newest'
  | 'oldest'
  | 'rating'
  | 'popular'
  | 'prep_time_asc'
  | 'prep_time_desc'
  | 'cook_time_asc'
  | 'cook_time_desc';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, any>;
}

export interface StatsOverview {
  totalUsers: number;
  totalRecipes: number;
  totalComments: number;
  activeUsers: number;
  pendingReviews: number;
  newUsers: number;
  newRecipes: number;
  topCuisines: Array<{ name: string; count: number }>;
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: 'recipe_created' | 'recipe_updated' | 'comment_added' | 'rating_added' | 'user_registered' | 'recipe_published';
  userId: string;
  user?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  targetId?: string;
  targetType?: 'recipe' | 'comment' | 'user';
  data?: Record<string, any>;
  createdAt: string;
}

export interface DashboardStats {
  total: {
    users: number;
    recipes: number;
    comments: number;
    categories: number;
  };
  recent: {
    newUsers: number;
    newRecipes: number;
    newComments: number;
  };
  pending: {
    reviews: number;
    reports: number;
  };
  top: {
    recipes: Recipe[];
    users: User[];
    categories: Category[];
  };
  activities: Activity[];
}

export interface UserRegistrationData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface RecipeCreateData {
  title: string;
  description: string;
  ingredients: Omit<Ingredient, 'id'>[];
  instructions: Omit<RecipeStep, 'id'>[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  tags: string[];
  images: string[];
  visibility: 'public' | 'private' | 'followers';
  nutrition?: Partial<NutritionInfo>;
}

export interface RecipeUpdateData extends Partial<RecipeCreateData> {
  status?: 'draft' | 'published' | 'pending_review' | 'archived';
}

export interface CommentCreateData {
  content: string;
  recipeId: string;
  parentId?: string;
  rating?: number;
}

export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  sort?: RecipeSortOption;
  filters?: RecipeFilters;
}

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'user' | 'admin' | 'moderator';
}

export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: Theme;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  status: AsyncStatus;
  data?: T;
  error?: string;
}