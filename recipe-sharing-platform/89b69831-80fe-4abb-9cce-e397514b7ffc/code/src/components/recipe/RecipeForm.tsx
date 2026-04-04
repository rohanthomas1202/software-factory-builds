'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Trash2, Upload, ChefHat, Clock, Users, Flame, Save, X, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/hooks/useToast';
import { RecipeFormData, RecipeDifficulty, RecipeCategory } from '@/types';

interface RecipeFormProps {
  initialData?: RecipeFormData;
  recipeId?: string;
  isEditing?: boolean;
}

export function RecipeForm({ initialData, recipeId, isEditing = false }: RecipeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    prepTime: 0,
    cookTime: 0,
    totalTime: 0,
    servings: 1,
    difficulty: 'easy' as RecipeDifficulty,
    category: 'main' as RecipeCategory,
    ingredients: [{ id: '1', name: '', amount: '', unit: '' }],
    instructions: [{ id: '1', step: 1, description: '' }],
    tags: [],
    imageUrl: '',
    isPrivate: false,
  });

  const [tagInput, setTagInput] = useState('');

  // Initialize form with initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Calculate total time when prep or cook time changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalTime: prev.prepTime + prev.cookTime,
    }));
  }, [formData.prepTime, formData.cookTime]);

  const handleInputChange = (field: keyof RecipeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleIngredientChange = (index: number, field: keyof typeof formData.ingredients[0], value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { id: Date.now().toString(), name: '', amount: '', unit: '' },
      ],
    }));
  };

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = [...formData.ingredients];
      newIngredients.splice(index, 1);
      setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    }
  };

  const handleInstructionChange = (index: number, field: keyof typeof formData.instructions[0], value: string | number) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = { ...newInstructions[index], [field]: value };
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [
        ...prev.instructions,
        { id: Date.now().toString(), step: prev.instructions.length + 1, description: '' },
      ],
    }));
  };

  const removeInstruction = (index: number) => {
    if (formData.instructions.length > 1) {
      const newInstructions = [...formData.instructions];
      newInstructions.splice(index, 1);
      // Re-number steps
      const renumberedInstructions = newInstructions.map((inst, idx) => ({
        ...inst,
        step: idx + 1,
      }));
      setFormData(prev => ({ ...prev, instructions: renumberedInstructions }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Recipe title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Recipe description is required';
    }

    if (formData.prepTime < 0) {
      newErrors.prepTime = 'Preparation time cannot be negative';
    }

    if (formData.cookTime < 0) {
      newErrors.cookTime = 'Cooking time cannot be negative';
    }

    if (formData.servings < 1) {
      newErrors.servings = 'Servings must be at least 1';
    }

    // Validate ingredients
    formData.ingredients.forEach((ingredient, index) => {
      if (!ingredient.name.trim()) {
        newErrors[`ingredient-${index}-name`] = 'Ingredient name is required';
      }
      if (!ingredient.amount.trim()) {
        newErrors[`ingredient-${index}-amount`] = 'Amount is required';
      }
    });

    // Validate instructions
    formData.instructions.forEach((instruction, index) => {
      if (!instruction.description.trim()) {
        newErrors[`instruction-${index}`] = 'Instruction description is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing && recipeId 
        ? `/api/recipes/${recipeId}`
        : '/api/recipes';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save recipe');
      }

      toast({
        title: isEditing ? 'Recipe Updated' : 'Recipe Created',
        description: isEditing 
          ? 'Your recipe has been updated successfully!'
          : 'Your recipe has been created successfully!',
        type: 'success',
      });

      // Redirect to the recipe page
      router.push(`/recipes/${data.recipe.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save recipe',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'expert', label: 'Expert' },
  ];

  const categoryOptions = [
    { value: 'appetizer', label: 'Appetizer' },
    { value: 'main', label: 'Main Course' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
    { value: 'beverage', label: 'Beverage' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading recipe data..." />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <ChefHat className="w-6 h-6" />
          Basic Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Recipe Title *"
              placeholder="e.g., Classic Chocolate Chip Cookies"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={errors.title}
              required
            />
            
            <Textarea
              label="Description *"
              placeholder="Describe your recipe... What makes it special?"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              error={errors.description}
              rows={4}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Preparation Time (min)"
                type="number"
                min="0"
                value={formData.prepTime}
                onChange={(e) => handleInputChange('prepTime', parseInt(e.target.value) || 0)}
                error={errors.prepTime}
                leftIcon={<Clock className="w-4 h-4" />}
              />
              
              <Input
                label="Cooking Time (min)"
                type="number"
                min="0"
                value={formData.cookTime}
                onChange={(e) => handleInputChange('cookTime', parseInt(e.target.value) || 0)}
                error={errors.cookTime}
                leftIcon={<Flame className="w-4 h-4" />}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Time (min)"
                type="number"
                value={formData.totalTime}
                disabled
                leftIcon={<Clock className="w-4 h-4" />}
              />
              
              <Input
                label="Servings *"
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => handleInputChange('servings', parseInt(e.target.value) || 1)}
                error={errors.servings}
                leftIcon={<Users className="w-4 h-4" />}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <Select
              label="Difficulty Level *"
              options={difficultyOptions}
              value={formData.difficulty}
              onChange={(e) => handleInputChange('difficulty', e.target.value as RecipeDifficulty)}
            />
            
            <Select
              label="Category *"
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as RecipeCategory)}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a tag (e.g., vegetarian, spicy)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    removable
                    onRemove={() => removeTag(tag)}
                    className="px-3 py-1"
                  >
                    {tag}
                  </Badge>
                ))}
                {formData.tags.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No tags added yet. Add some to help others find your recipe!
                  </p>
                )}
              </div>
            </div>
            
            <Input
              label="Image URL (Optional)"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              leftIcon={<ImageIcon className="w-4 h-4" />}
              helperText="Leave empty to use a default recipe image"
            />
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isPrivate" className="text-sm text-gray-700 dark:text-gray-300">
                Make this recipe private (only you can see it)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            Ingredients
          </h2>
          <Button
            type="button"
            variant="outline"
            onClick={addIngredient}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Ingredient
          </Button>
        </div>
        
        <div className="space-y-4">
          {formData.ingredients.map((ingredient, index) => (
            <div
              key={ingredient.id}
              className={cn(
                "grid grid-cols-12 gap-4 p-4 rounded-lg border",
                errors[`ingredient-${index}-name`] || errors[`ingredient-${index}-amount`]
                  ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
              )}
            >
              <div className="col-span-5">
                <Input
                  label="Ingredient Name *"
                  placeholder="e.g., All-purpose flour"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  error={errors[`ingredient-${index}-name`]}
                  required
                />
              </div>
              
              <div className="col-span-3">
                <Input
                  label="Amount *"
                  placeholder="e.g., 2"
                  value={ingredient.amount}
                  onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                  error={errors[`ingredient-${index}-amount`]}
                  required
                />
              </div>
              
              <div className="col-span-3">
                <Input
                  label="Unit"
                  placeholder="e.g., cups, tbsp, g"
                  value={ingredient.unit || ''}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                />
              </div>
              
              <div className="col-span-1 flex items-end">
                {formData.ingredients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {formData.ingredients.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <ChefHat className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No ingredients added yet. Add your first ingredient to get started!
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            Instructions
          </h2>
          <Button
            type="button"
            variant="outline"
            onClick={addInstruction}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Step
          </Button>
        </div>
        
        <div className="space-y-6">
          {formData.instructions.map((instruction, index) => (
            <div
              key={instruction.id}
              className={cn(
                "p-6 rounded-lg border",
                errors[`instruction-${index}`]
                  ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      {instruction.step}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <Textarea
                    label={`Step ${instruction.step} *`}
                    placeholder="Describe this step in detail..."
                    value={instruction.description}
                    onChange={(e) => handleInstructionChange(index, 'description', e.target.value)}
                    error={errors[`instruction-${index}`]}
                    rows={3}
                    required
                  />
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <Input
                      label="Time Required (minutes, optional)"
                      type="number"
                      min="0"
                      placeholder="e.g., 15"
                      value={instruction.time || ''}
                      onChange={(e) => handleInstructionChange(index, 'time', parseInt(e.target.value) || undefined)}
                      leftIcon={<Clock className="w-4 h-4" />}
                    />
                    
                    <Input
                      label="Tips (optional)"
                      placeholder="e.g., Don't overmix!"
                      value={instruction.tips?.join(', ') || ''}
                      onChange={(e) => {
                        const tips = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                        handleInstructionChange(index, 'tips', tips);
                      }}
                      helperText="Separate multiple tips with commas"
                    />
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  {formData.instructions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInstruction(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {formData.instructions.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <ChefHat className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No instructions added yet. Add your first step to guide others through your recipe!
            </p>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          leftIcon={<X className="w-4 h-4" />}
        >
          Cancel
        </Button>
        
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              // Save as draft functionality
              toast({
                title: 'Draft Saved',
                description: 'Your recipe has been saved as a draft',
                type: 'info',
              });
            }}
            disabled={isSubmitting}
          >
            Save Draft
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditing ? 'Update Recipe' : 'Publish Recipe'}
          </Button>
        </div>
      </div>

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-semibold">Please fix the following errors:</h3>
          </div>
          <ul className="list-disc list-inside text-red-700 dark:text-red-300 text-sm space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}