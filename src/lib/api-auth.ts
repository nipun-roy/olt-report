import { auth } from "./auth";
import { NextResponse } from "next/server";

/**
 * Validates Better Auth session from request headers
 */
export async function getApiSession(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return session;
  } catch (err) {
    console.error("Auth session check error:", err);
    return null;
  }
}

/**
 * Guards API routes: returns 401 Unauthorized if request has no valid user session
 */
export async function requireApiAuth(request: Request) {
  const session = await getApiSession(request);
  if (!session || !session.user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "অননুমোদিত অনুরোধ! এই কাজটি করার জন্য দয়া করে প্রথমে সিস্টেমে লগইন করুন। (Unauthorized: Please log in)",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      ),
      user: null,
      session: null,
    };
  }
  return {
    authorized: true as const,
    response: null,
    user: session.user,
    session: session.session,
  };
}
