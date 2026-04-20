// lib/server-auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function auth() {
  const session = await getServerSession(authOptions);
  return session;
}



