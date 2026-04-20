// components/DebugAuth.tsx
import { useSession } from "next-auth/react";
import React from 'react'

export default function DebugAuth() {
  const { data: session, status } = useSession();
  
  console.log('Session in component:', session);
  console.log('Status:', status);
  
  return (
    <div>
      <pre>
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}