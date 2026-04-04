// Core entity types for RecipeShare platform

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverImageUrl: string;
  joinDate: string;
  followers: string[]; // user IDs
  following: string[]; // user IDs
  recipeCount: number;
  savedRecipes: string[]; // recipe IDs
  isAdmin: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl: string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  totalTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  ingredients: Ingredient[];
  instructions: Instruction[];
  imageUrl: string;
  rating: number;
  ratingCount: number;
  ratings: UserRating[];
  commentCount: number;
  savedCount: number;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  isFeatured: boolean;
  dietaryInfo: DietaryInfo;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit?: string;
  notes?: string;
}

export interface Instruction {
  id: string;
  step: number;
  description: string;
  time?: number; // in minutes
  tips?: string[];
}

export interface Comment {
  id: string;
  recipeId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  likes: string[]; // user IDs
  isEdited: boolean;
  parentId?: string; // for nested comments
}

export interface UserRating {
  userId: string;
  rating: number; // 1-5
  createdAt: string;
}

export interface DietaryInfo {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  nutFree: boolean;
  lowCarb: boolean;
  keto: boolean;
  paleo: boolean;
}

export interface RecipeFormData {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  ingredients: Omit<Ingredient, 'id'>[];
  instructions: Omit<Instruction, 'id'>[];
  imageUrl: string;
  dietaryInfo: DietaryInfo;
}

export interface RecipeFilters {
  search?: string;
  category?: string;
  tags?: string[];
  difficulty?: ('easy' | 'medium' | 'hard')[];
  prepTime?: number; // max prep time in minutes
  cookTime?: number; // max cook time in minutes
  dietary?: (keyof DietaryInfo)[];
  rating?: number; // minimum rating
  authorId?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export type RecipeSortOption = 
  | 'newest'
  | 'oldest'
  | 'rating'
  | 'popular'
  | 'prepTime'
  | 'cookTime'
  | 'totalTime'
  | 'servings';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface UserUpdateData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
}

export interface CommentFormData {
  content: string;
  parentId?: string;
}

export interface RatingFormData {
  rating: number;
}

// Utility types
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type Nullable<T> = T | null;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};