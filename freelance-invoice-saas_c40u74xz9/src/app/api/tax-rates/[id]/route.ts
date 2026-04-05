import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { store } from '@/lib/store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    
    const taxRate = store.taxRates.find(
      rate => rate.id === id && rate.userId === user.id
    );
    
    if (!taxRate) {
      return Response.json(
        { error: 'Tax rate not found' },
        { status: 404 }
      );
    }
    
    return Response.json({ data: taxRate });
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

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    
    const taxRateIndex = store.taxRates.findIndex(
      rate => rate.id === id && rate.userId === user.id
    );
    
    if (taxRateIndex === -1) {
      return Response.json(
        { error: 'Tax rate not found' },
        { status: 404 }
      );
    }
    
    const taxRate = store.taxRates[taxRateIndex];
    
    // Validate rate if provided
    if (body.rate !== undefined) {
      if (typeof body.rate !== 'number' || body.rate < 0 || body.rate > 100) {
        return Response.json(
          { error: 'Rate must be a number between 0 and 100' },
          { status: 400 }
        );
      }
      taxRate.rate = parseFloat(body.rate.toFixed(2));
    }
    
    // Validate name if provided
    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return Response.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      
      // Check for duplicate name (excluding current rate)
      const existingRate = store.taxRates.find(
        rate => rate.userId === user.id && 
        rate.id !== id &&
        rate.name.toLowerCase() === body.name.trim().toLowerCase()
      );
      
      if (existingRate) {
        return Response.json(
          { error: 'A tax rate with this name already exists' },
          { status: 409 }
        );
      }
      
      taxRate.name = body.name.trim();
    }
    
    // Handle default status
    if (body.isDefault !== undefined) {
      taxRate.isDefault = Boolean(body.isDefault);
      
      // If setting as default, unset any existing default
      if (taxRate.isDefault) {
        store.taxRates.forEach(rate => {
          if (rate.userId === user.id && rate.id !== id && rate.isDefault) {
            rate.isDefault = false;
            rate.updatedAt = new Date();
          }
        });
      }
    }
    
    taxRate.updatedAt = new Date();
    
    return Response.json({ data: taxRate });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    return Response.json(
      { error: 'Failed to update tax rate' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    
    const taxRateIndex = store.taxRates.findIndex(
      rate => rate.id === id && rate.userId === user.id
    );
    
    if (taxRateIndex === -1) {
      return Response.json(
        { error: 'Tax rate not found' },
        { status: 404 }
      );
    }
    
    const taxRate = store.taxRates[taxRateIndex];
    
    // Check if tax rate is in use by any invoices
    const isInUse = store.invoices.some(
      invoice => invoice.userId === user.id && invoice.taxRate.id === id
    );
    
    if (isInUse) {
      return Response.json(
        { error: 'Cannot delete tax rate that is in use by invoices' },
        { status: 409 }
      );
    }
    
    // Prevent deleting default tax rate if it's the only one
    if (taxRate.isDefault) {
      const userRates = store.taxRates.filter(rate => rate.userId === user.id);
      if (userRates.length === 1) {
        return Response.json(
          { error: 'Cannot delete the only tax rate' },
          { status: 409 }
        );
      }
    }
    
    // Remove from store
    store.taxRates.splice(taxRateIndex, 1);
    
    // If we deleted the default, set another rate as default
    if (taxRate.isDefault) {
      const userRates = store.taxRates.filter(rate => rate.userId === user.id);
      if (userRates.length > 0) {
        userRates[0].isDefault = true;
        userRates[0].updatedAt = new Date();
      }
    }
    
    return Response.json({ data: { success: true } });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    return Response.json(
      { error: 'Failed to delete tax rate' },
      { status: 500 }
    );
  }
}