import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json({ message: 'Session cleared' });
  
  // Удаляем все возможные next-auth cookies
  const cookiesToClear = [
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token',
    '__Host-next-auth.csrf-token',
  ];
  
  cookiesToClear.forEach(name => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
    });
  });
  
  return response;
}