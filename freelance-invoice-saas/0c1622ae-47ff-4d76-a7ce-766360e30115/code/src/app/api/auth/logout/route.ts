import { NextRequest } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await destroySession();
    
    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}