import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getSessionFromRequest(request);
    
    // Clear the session cookie
    const response = NextResponse.json({
      data: { success: true }
    });
    
    response.cookies.delete('finance_session');
    
    // If there was a session, destroy it server-side
    if (session) {
      // Extract token from cookies
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split(';').map(cookie => {
            const [name, ...value] = cookie.trim().split('=');
            return [name, value.join('=')];
          })
        );
        
        const sessionToken = cookies['finance_session'];
        if (sessionToken) {
          destroySession(sessionToken);
        }
      }
    }
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}