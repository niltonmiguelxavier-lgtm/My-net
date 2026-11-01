"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
 const router=useRouter(); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");const f=new FormData(e.currentTarget);const email=String(f.get("email")||"").trim().toLowerCase();const password=String(f.get("password")||"");
  try{const sb=createSupabaseBrowserClient(); if(mode==="login"){const {error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;router.push("/dashboard");router.refresh();return;}
  const full_name=String(f.get("full_name")||"").trim();const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name},emailRedirectTo:`${location.origin}/dashboard`}});if(error)throw error;
  if(!data.session){setMessage("Conta criada. Confirma o endereço através do email enviado para iniciar sessão.");return;} router.push("/dashboard");router.refresh();
  }catch(err){setMessage(err instanceof Error?err.message:"Não foi possível concluir. Verifica os dados e tenta novamente.");}finally{setBusy(false);}}
 return <form onSubmit={submit} className="space-y-4">{mode==="register"&&<label className="block text-sm font-medium text-slate-700">Nome completo<input required name="full_name" minLength={2} maxLength={180} autoComplete="name" className="mt-1.5 w-full rounded-lg border-slate-300 px-3.5 py-3"/></label>}<label className="block text-sm font-medium text-slate-700">Email<input required name="email" type="email" maxLength={320} autoComplete="email" className="mt-1.5 w-full rounded-lg border-slate-300 px-3.5 py-3"/></label><label className="block text-sm font-medium text-slate-700">Palavra-passe<input required name="password" type="password" minLength={mode==="register"?12:1} maxLength={72} autoComplete={mode==="register"?"new-password":"current-password"} className="mt-1.5 w-full rounded-lg border-slate-300 px-3.5 py-3"/>{mode==="register"&&<span className="mt-1 block text-xs text-slate-500">Mínimo de 12 caracteres.</span>}</label>{message&&<p role="status" className="rounded-lg bg-teal-50 p-3 text-sm text-teal-950">{message}</p>}<button disabled={busy} className="w-full rounded-lg bg-brand px-4 py-3.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{busy?"A processar…":mode==="register"?"Criar conta":"Entrar"}</button><p className="text-center text-sm text-slate-600">{mode==="register"?"Já tens conta?":"Ainda não tens conta?"} <Link className="font-semibold text-brand" href={mode==="register"?"/login":"/register"}>{mode==="register"?"Entrar":"Criar conta"}</Link></p></form>;
}
