// // app/page.tsx
// import { React } from 'react'
// import { auth } from "@/lib/auth";

// export default async function Home() {
//   const session = await auth();
  
//   console.log('Full session:', session);
  
//   if (session?.user) {
//     return (
//       <div>
//         <h1>Добро пожаловать, {session.user.name}!</h1>
//         <p>ID VK: {session.user.id}</p>
//         {session.user.email && <p>Email: {session.user.email}</p>}
//         {session.user.image && (
//           <img src={session.user.image} alt="Avatar" width={100} />
//         )}
//       </div>
//     );
//   }
  
//   return <a href="/api/auth/signin">Войти через VK</a>;
// }