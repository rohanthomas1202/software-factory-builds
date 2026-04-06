import { NextRequest } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function POST(request: NextRequest) {
  try {
    // In production, you might want to add authentication/authorization
    // For now, we'll allow seeding in development only
    if (process.env.NODE_ENV === 'production') {
      return Response.json(
        { error: 'Seeding is not allowed in production' },
        { status: 403 }
      );
    }

    seedDatabase();

    return Response.json({
      data: {
        message: 'Database seeded successfully',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to seed database:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';