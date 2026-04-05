import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { store } from '@/lib/store';
import { TaxRate } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Get tax rates for current user
    const taxRates = store.taxRates.filter(rate => rate.userId === user.id);
    
    // Return default tax rate if none exist
    if (taxRates.length === 0) {
      const defaultRate: TaxRate = {
        id: 'default',
        userId: user.id,
        name: 'Standard',
        rate: 0, // 0% tax by default
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return Response.json({ data: [defaultRate] });
    }
    
    // Sort by creation date (newest first)
    const sortedRates = taxRates.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    
    return Response.json({ data: sortedRates });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    // Validate required fields
    if (!body.name?.trim()) {
      return Response.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    if (typeof body.rate !== 'number' || body.rate < 0 || body.rate > 100) {
      return Response.json(
        { error: 'Rate must be a number between 0 and 100' },
        { status: 400 }
      );
    }
    
    // Check for duplicate name
    const existingRate = store.taxRates.find(
      rate => rate.userId === user.id && 
      rate.name.toLowerCase() === body.name.trim().toLowerCase()
    );
    
    if (existingRate) {
      return Response.json(
        { error: 'A tax rate with this name already exists' },
        { status: 409 }
      );
    }
    
    // Create new tax rate
    const newRate: TaxRate = {
      id: Date.now().toString(), // Simple ID for in-memory store
      userId: user.id,
      name: body.name.trim(),
      rate: parseFloat(body.rate.toFixed(2)), // Store with 2 decimal places
      isDefault: body.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // If this is set as default, unset any existing default
    if (newRate.isDefault) {
      store.taxRates.forEach(rate => {
        if (rate.userId === user.id && rate.isDefault) {
          rate.isDefault = false;
          rate.updatedAt = new Date();
        }
      });
    }
    
    store.taxRates.push(newRate);
    
    return Response.json({ data: newRate }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    return Response.json(
      { error: 'Failed to create tax rate' },
      { status: 500 }
    );
  }
}