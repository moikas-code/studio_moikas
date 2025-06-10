import { NextResponse } from "next/server";
import { check_admin_access } from "@/lib/utils/api/admin";

export async function GET() {
  const result = await check_admin_access();
  
  return NextResponse.json(result, { 
    status: result.is_admin ? 200 : (result.error === "Not authenticated" ? 401 : 403)
  });
}