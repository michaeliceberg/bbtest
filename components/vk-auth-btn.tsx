'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import React from 'react';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Загрузка...</div>;

  if (session) {

    // console.log('Session data:', session);
    // console.log('User ID:', session?.user?.id);
    // console.log('User name:', session?.user?.name);

    // console.log('name', session.user?.name)
    // console.log('id', session.user?.id)
    // console.log('email', session.user?.email)
    // console.log('image', session.user?.image)
    

    return (
      <div>
        Добро Добро пожаловать, {session.user?.name}! <br />
        <button onClick={() => signOut()}>Выйти</button>
        {/* <br /> id
        {session.user?.id}
        <br /> email
        {session.user?.email}
        <br /> image
        {session.user?.image} */}

      </div>
    );
  }

  return (
    <button onClick={() => signIn('vk')}>
      Войти через ВКонтакте
    </button>
  );
}