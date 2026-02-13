import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Validate redirect path to prevent open redirect attacks
function getSafeRedirectPath(next: string | null): string {
  if (!next) return '/dashboard'
  // Only allow relative paths starting with /
  // Reject protocol-relative URLs (//evil.com), absolute URLs, and paths with encoded characters
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return '/dashboard'
  }
  return next
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Store Google tokens for Drive access
      const { provider_token, provider_refresh_token } = data.session

      if (provider_token) {
        await supabase.from('teachers').upsert({
          id: data.session.user.id,
          email: data.session.user.email,
          name: data.session.user.user_metadata?.full_name,
          google_drive_token: {
            access_token: provider_token,
            refresh_token: provider_refresh_token,
            scopes: 'drive.file drive.metadata.readonly',
          },
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
