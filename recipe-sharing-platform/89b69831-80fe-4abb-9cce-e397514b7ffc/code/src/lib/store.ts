import { User, Recipe, Comment, RecipeFilters, RecipeSortOption } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// In-memory data store using Maps for O(1) lookups
class RecipeStore {
  private static instance: RecipeStore;
  
  // Data stores
  private users: Map<string, User>;
  private recipes: Map<string, Recipe>;
  private comments: Map<string, Comment>;
  private sessions: Map<string, { userId: string; expiresAt: Date }>;
  
  // Indexes for faster lookups
  private usernameToId: Map<string, string>;
  private emailToId: Map<string, string>;
  private recipesByUser: Map<string, string[]>;
  private commentsByRecipe: Map<string, string[]>;
  private commentsByUser: Map<string, string[]>;
  private savedRecipesByUser: Map<string, string[]>;
  
  private constructor() {
    this.users = new Map();
    this.recipes = new Map();
    this.comments = new Map();
    this.sessions = new Map();
    
    this.usernameToId = new Map();
    this.emailToId = new Map();
    this.recipesByUser = new Map();
    this.commentsByRecipe = new Map();
    this.commentsByUser = new Map();
    this.savedRecipesByUser = new Map();
    
    this.seedInitialData();
  }
  
  public static getInstance(): RecipeStore {
    if (!RecipeStore.instance) {
      RecipeStore.instance = new RecipeStore();
    }
    return RecipeStore.instance;
  }
  
  // User methods
  createUser(user: Omit<User, 'id' | 'joinDate' | 'followers' | 'following' | 'recipeCount' | 'savedRecipes' | 'isAdmin'>): User {
    const id = uuidv4();
    const newUser: User = {
      ...user,
      id,
      joinDate: new Date().toISOString(),
      followers: [],
      following: [],
      recipeCount: 0,
      savedRecipes: [],
      isAdmin: false,
    };
    
    this.users.set(id, newUser);
    this.usernameToId.set(user.username, id);
    this.emailToId.set(user.email, id);
    this.recipesByUser.set(id, []);
    this.commentsByUser.set(id, []);
    this.savedRecipesByUser.set(id, []);
    
    return newUser;
  }
  
  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }
  
  getUserByUsername(username: string): User | undefined {
    const id = this.usernameToId.get(username);
    return id ? this.users.get(id) : undefined;
  }
  
  getUserByEmail(email: string): User | undefined {
    const id = this.emailToId.get(email);
    return id ? this.users.get(id) : undefined;
  }
  
  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'username' | 'email' | 'joinDate'>>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }
  
  deleteUser(id: string): boolean {
    const user = this.users.get(id);
    if (!user) return false;
    
    // Remove user's recipes
    const userRecipeIds = this.recipesByUser.get(id) || [];
    userRecipeIds.forEach(recipeId => {
      this.recipes.delete(recipeId);
      this.commentsByRecipe.delete(recipeId);
    });
    
    // Remove user's comments
    const userCommentIds = this.commentsByUser.get(id) || [];
    userCommentIds.forEach(commentId => {
      this.comments.delete(commentId);
    });
    
    // Remove from followers/following lists
    user.followers.forEach(followerId => {
      const follower = this.users.get(followerId);
      if (follower) {
        this.updateUser(followerId, {
          following: follower.following.filter(followingId => followingId !== id)
        });
      }
    });
    
    user.following.forEach(followingId => {
      const followingUser = this.users.get(followingId);
      if (followingUser) {
        this.updateUser(followingId, {
          followers: followingUser.followers.filter(followerId => followerId !== id)
        });
      }
    });
    
    // Remove from indexes
    this.usernameToId.delete(user.username);
    this.emailToId.delete(user.email);
    this.recipesByUser.delete(id);
    this.commentsByUser.delete(id);
    this.savedRecipesByUser.delete(id);
    this.users.delete(id);
    
    return true;
  }
  
  followUser(followerId: string, followingId: string): boolean {
    const follower = this.users.get(followerId);
    const following = this.users.get(followingId);
    
    if (!follower || !following || followerId === followingId) return false;
    
    if (!follower.following.includes(followingId)) {
      follower.following.push(followingId);
      following.followers.push(followerId);
      
      this.users.set(followerId, follower);
      this.users.set(followingId, following);
    }
    
    return true;
  }
  
  unfollowUser(followerId: string, followingId: string): boolean {
    const follower = this.users.get(followerId);
    const following = this.users.get(followingId);
    
    if (!follower || !following) return false;
    
    follower.following = follower.following.filter(id => id !== followingId);
    following.followers = following.followers.filter(id => id !== followerId);
    
    this.users.set(followerId, follower);
    this.users.set(followingId, following);
    
    return true;
  }
  
  // Recipe methods
  createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'ratingCount' | 'comments' | 'saves'>): Recipe {
    const id = uuidv4();
    const newRecipe: Recipe = {
      ...recipe,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 0,
      ratingCount: 0,
      comments: [],
      saves: 0,
    };
    
    this.recipes.set(id, newRecipe);
    
    // Update user's recipe count
    const user = this.users.get(recipe.authorId);
    if (user) {
      user.recipeCount++;
      this.users.set(user.id, user);
    }
    
    // Update recipesByUser index
    const userRecipes = this.recipesByUser.get(recipe.authorId) || [];
    userRecipes.push(id);
    this.recipesByUser.set(recipe.authorId, userRecipes);
    
    // Initialize comments index
    this.commentsByRecipe.set(id, []);
    
    return newRecipe;
  }
  
  getRecipeById(id: string): Recipe | undefined {
    return this.recipes.get(id);
  }
  
  getRecipes(filters?: RecipeFilters, sort?: RecipeSortOption, page = 1, limit = 20): { recipes: Recipe[]; total: number } {
    let recipes = Array.from(this.recipes.values());
    
    // Apply filters
    if (filters) {
      if (filters.category) {
        recipes = recipes.filter(recipe => recipe.category === filters.category);
      }
      
      if (filters.difficulty) {
        recipes = recipes.filter(recipe => recipe.difficulty === filters.difficulty);
      }
      
      if (filters.cookingTime) {
        recipes = recipes.filter(recipe => recipe.cookingTime <= filters.cookingTime!);
      }
      
      if (filters.servings) {
        recipes = recipes.filter(recipe => recipe.servings >= filters.servings!);
      }
      
      if (filters.dietary) {
        recipes = recipes.filter(recipe => 
          recipe.dietaryRestrictions?.includes(filters.dietary!)
        );
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        recipes = recipes.filter(recipe => 
          recipe.title.toLowerCase().includes(searchLower) ||
          recipe.description.toLowerCase().includes(searchLower) ||
          recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchLower))
        );
      }
      
      if (filters.authorId) {
        recipes = recipes.filter(recipe => recipe.authorId === filters.authorId);
      }
    }
    
    // Apply sorting
    if (sort) {
      switch (sort) {
        case 'newest':
          recipes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'oldest':
          recipes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'rating':
          recipes.sort((a, b) => b.rating - a.rating);
          break;
        case 'popular':
          recipes.sort((a, b) => b.saves - a.saves);
          break;
        case 'cookingTime':
          recipes.sort((a, b) => a.cookingTime - b.cookingTime);
          break;
      }
    }
    
    const total = recipes.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      recipes: recipes.slice(start, end),
      total,
    };
  }
  
  updateRecipe(id: string, updates: Partial<Omit<Recipe, 'id' | 'authorId' | 'createdAt' | 'rating' | 'ratingCount' | 'comments' | 'saves'>>): Recipe | undefined {
    const recipe = this.recipes.get(id);
    if (!recipe) return undefined;
    
    const updatedRecipe = { 
      ...recipe, 
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    this.recipes.set(id, updatedRecipe);
    return updatedRecipe;
  }
  
  deleteRecipe(id: string): boolean {
    const recipe = this.recipes.get(id);
    if (!recipe) return false;
    
    // Update author's recipe count
    const author = this.users.get(recipe.authorId);
    if (author) {
      author.recipeCount--;
      this.users.set(author.id, author);
    }
    
    // Remove from recipesByUser index
    const userRecipes = this.recipesByUser.get(recipe.authorId) || [];
    this.recipesByUser.set(
      recipe.authorId,
      userRecipes.filter(recipeId => recipeId !== id)
    );
    
    // Remove recipe comments
    const commentIds = this.commentsByRecipe.get(id) || [];
    commentIds.forEach(commentId => {
      this.comments.delete(commentId);
    });
    
    // Remove from indexes
    this.commentsByRecipe.delete(id);
    this.recipes.delete(id);
    
    return true;
  }
  
  // Rating methods
  rateRecipe(recipeId: string, userId: string, rating: number): Recipe | undefined {
    const recipe = this.recipes.get(recipeId);
    if (!recipe || rating < 1 || rating > 5) return undefined;
    
    // In a real app, we'd track individual ratings
    // For simplicity, we'll just update the average
    const newTotalRating = recipe.rating * recipe.ratingCount + rating;
    const newRatingCount = recipe.ratingCount + 1;
    const newAverage = newTotalRating / newRatingCount;
    
    recipe.rating = parseFloat(newAverage.toFixed(1));
    recipe.ratingCount = newRatingCount;
    
    this.recipes.set(recipeId, recipe);
    return recipe;
  }
  
  // Comment methods
  createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Comment {
    const id = uuidv4();
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.comments.set(id, newComment);
    
    // Update recipe comments
    const recipe = this.recipes.get(comment.recipeId);
    if (recipe) {
      recipe.comments.push(id);
      this.recipes.set(recipe.id, recipe);
    }
    
    // Update indexes
    const recipeComments = this.commentsByRecipe.get(comment.recipeId) || [];
    recipeComments.push(id);
    this.commentsByRecipe.set(comment.recipeId, recipeComments);
    
    const userComments = this.commentsByUser.get(comment.authorId) || [];
    userComments.push(id);
    this.commentsByUser.set(comment.authorId, userComments);
    
    return newComment;
  }
  
  getCommentById(id: string): Comment | undefined {
    return this.comments.get(id);
  }
  
  getCommentsByRecipeId(recipeId: string): Comment[] {
    const commentIds = this.commentsByRecipe.get(recipeId) || [];
    return commentIds
      .map(id => this.comments.get(id))
      .filter(Boolean) as Comment[];
  }
  
  updateComment(id: string, content: string): Comment | undefined {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    comment.content = content;
    comment.updatedAt = new Date().toISOString();
    
    this.comments.set(id, comment);
    return comment;
  }
  
  deleteComment(id: string): boolean {
    const comment = this.comments.get(id);
    if (!comment) return false;
    
    // Remove from recipe comments
    const recipe = this.recipes.get(comment.recipeId);
    if (recipe) {
      recipe.comments = recipe.comments.filter(commentId => commentId !== id);
      this.recipes.set(recipe.id, recipe);
    }
    
    // Remove from indexes
    const recipeComments = this.commentsByRecipe.get(comment.recipeId) || [];
    this.commentsByRecipe.set(
      comment.recipeId,
      recipeComments.filter(commentId => commentId !== id)
    );
    
    const userComments = this.commentsByUser.get(comment.authorId) || [];
    this.commentsByUser.set(
      comment.authorId,
      userComments.filter(commentId => commentId !== id)
    );
    
    this.comments.delete(id);
    return true;
  }
  
  // Save/Unsave recipe methods
  saveRecipe(userId: string, recipeId: string): boolean {
    const user = this.users.get(userId);
    const recipe = this.recipes.get(recipeId);
    
    if (!user || !recipe) return false;
    
    if (!user.savedRecipes.includes(recipeId)) {
      user.savedRecipes.push(recipeId);
      recipe.saves++;
      
      this.users.set(userId, user);
      this.recipes.set(recipeId, recipe);
      
      // Update savedRecipesByUser index
      const savedRecipes = this.savedRecipesByUser.get(userId) || [];
      savedRecipes.push(recipeId);
      this.savedRecipesByUser.set(userId, savedRecipes);
    }
    
    return true;
  }
  
  unsaveRecipe(userId: string, recipeId: string): boolean {
    const user = this.users.get(userId);
    const recipe = this.recipes.get(recipeId);
    
    if (!user || !recipe) return false;
    
    user.savedRecipes = user.savedRecipes.filter(id => id !== recipeId);
    recipe.saves = Math.max(0, recipe.saves - 1);
    
    this.users.set(userId, user);
    this.recipes.set(recipeId, recipe);
    
    // Update savedRecipesByUser index
    const savedRecipes = this.savedRecipesByUser.get(userId) || [];
    this.savedRecipesByUser.set(
      userId,
      savedRecipes.filter(id => id !== recipeId)
    );
    
    return true;
  }
  
  getSavedRecipes(userId: string): Recipe[] {
    const savedRecipeIds = this.savedRecipesByUser.get(userId) || [];
    return savedRecipeIds
      .map(id => this.recipes.get(id))
      .filter(Boolean) as Recipe[];
  }
  
  // Session methods
  createSession(userId: string, expiresAt: Date): string {
    const sessionId = uuidv4();
    this.sessions.set(sessionId, { userId, expiresAt });
    return sessionId;
  }
  
  getSession(sessionId: string): { userId: string; expiresAt: Date } | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    
    return session;
  }
  
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
  
  // Admin methods
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
  
  getAllRecipes(): Recipe[] {
    return Array.from(this.recipes.values());
  }
  
  // Feed generation
  getFeedForUser(userId: string, limit = 20): Recipe[] {
    const user = this.users.get(userId);
    if (!user) return [];
    
    // Get recipes from followed users
    const followedUserIds = user.following;
    const allRecipes: Recipe[] = [];
    
    followedUserIds.forEach(followedId => {
      const recipeIds = this.recipesByUser.get(followedId) || [];
      recipeIds.forEach(recipeId => {
        const recipe = this.recipes.get(recipeId);
        if (recipe) allRecipes.push(recipe);
      });
    });
    
    // Sort by newest first
    allRecipes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return allRecipes.slice(0, limit);
  }
  
  // Seed initial data
  private seedInitialData() {
    // This will be populated by the seed.ts file
  }
}

export { RecipeStore };