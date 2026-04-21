'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import React from 'react';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Загрузка...</div>;

  if (session) {
    return (
      <div>
        Добро пожаловать, {session.user?.name}! <br />
        <button onClick={() => signOut()}>Выйти</button>
      </div>
    );
  }

  return (
    <button onClick={() => signIn('vk')}>
      Войти через ВКонтакте
    </button>
  );
}