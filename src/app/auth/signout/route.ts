import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function POST(request:NextRequest){const sb=await createSupabaseServerClient();if(sb)await sb.auth.signOut();return NextResponse.redirect(new URL("/",request.url),303);}
