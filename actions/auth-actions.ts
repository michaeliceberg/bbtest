// app/actions/auth-actions.ts

'use server';

import { redirect } from 'next/navigation';

export async function signOutAction() {
  // Просто редирект на страницу выхода
  redirect('/api/auth/signout');
}