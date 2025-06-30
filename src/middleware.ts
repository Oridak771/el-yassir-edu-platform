import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/data'

export async function middleware(request: NextRequest) {
  // Check if the request is for the dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      const session = await auth.getSession()
      if (!session.user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}
