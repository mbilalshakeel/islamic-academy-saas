import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for use inside Route Handlers / Server
 * Components / Server Actions.
 *
 * Still uses ONLY the public anon key — never service_role. The
 * difference from the browser client is purely that it reads/writes
 * the user's session from Next.js cookies() instead of browser
 * localStorage, so a logged-in user's session (and therefore their
 * tenant_id claim) is available to server-rendered pages and API
 * routes, not just client components.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component during render — safe to ignore,
            // middleware is responsible for refreshing the session cookie there.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // See note above.
          }
        },
      },
    }
  );
}
