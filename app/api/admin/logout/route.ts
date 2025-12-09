import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Logout route - sempre dinamica
export const revalidate = 0

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete("admin-auth")
  
  return NextResponse.json({ success: true })
}

