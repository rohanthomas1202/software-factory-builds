'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChefHat } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export function HeroSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (category) params.set('category', category);
    if (difficulty) params.set('difficulty', difficulty);
    
    router.push(`/recipes?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-2 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-2">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
              <Input
                type="text"
                placeholder="Search for recipes, ingredients, or chefs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 h-auto bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:bg-white/10 focus:border-white/40 rounded-xl"
              />
            </div>
          </div>

          {/* Category Select */}
          <div className="w-full md:w-48">
            <div className="relative">
              <ChefHat className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: '', label: 'All Categories' },
                  { value: 'italian', label: 'Italian' },
                  { value: 'asian', label: 'Asian' },
                  { value: 'mexican', label: 'Mexican' },
                  { value: 'dessert', label: 'Desserts' },
                  { value: 'vegetarian', label: 'Vegetarian' },
                  { value: 'vegan', label: 'Vegan' },
                  { value: 'breakfast', label: 'Breakfast' },
                ]}
                className="pl-10 pr-4 py-3 h-auto bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:bg-white/10 focus:border-white/40 rounded-xl [&>option]:text-gray-900"
              />
            </div>
          </div>

          {/* Difficulty Select */}
          <div className="w-full md:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                options={[
                  { value: '', label: 'Any Difficulty' },
                  { value: 'easy', label: 'Easy' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'hard', label: 'Hard' },
                ]}
                className="pl-10 pr-4 py-3 h-auto bg-white/5 border-white/20 text-white placeholder:text-white/60 focus:bg-white/10 focus:border-white/40 rounded-xl [&>option]:text-gray-900"
              />
            </div>
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            variant="primary"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-0 shadow-lg h-auto py-3 px-8 rounded-xl"
          >
            <Search className="mr-2 h-5 w-5" />
            Search
          </Button>
        </div>
      </div>

      {/* Quick Search Suggestions */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {['Pasta', 'Chicken', 'Vegetarian', '30 Minutes', 'Dessert', 'Healthy'].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => {
              setSearchQuery(tag);
              router.push(`/recipes?search=${encodeURIComponent(tag)}`);
            }}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full hover:bg-white/20 transition-colors text-sm"
          >
            {tag}
          </button>
        ))}
      </div>
    </form>
  );
}