import { signOut } from "@/auth";

export async function GET() {
  return Response.json({ message: "Use POST to sign out" }, { status: 405 });
}

export async function POST() {
  await signOut({ redirectTo: "/" });
  return Response.json({ success: true });
}
