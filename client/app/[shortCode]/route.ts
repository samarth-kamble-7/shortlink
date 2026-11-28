import { NextResponse } from "next/server";

const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL || "http://localhost:8080";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  if (!shortCode || shortCode === "favicon.ico") {
    return new Response(null, { status: 404 });
  }

  try {
    const res = await fetch(`${BACKEND_INTERNAL_URL}/${shortCode}`, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": request.headers.get("user-agent") || "",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        Referer: request.headers.get("referer") || "",
      },
    });

    const location = res.headers.get("location");
    if (location) {
      return NextResponse.redirect(new URL(location), { status: 302 });
    }
  } catch (err) {
    console.error("Redirect lookup error:", err);
  }

  // Fallback: If not found or backend unreachable, redirect to homepage
  return NextResponse.redirect(new URL("/", request.url));
}
