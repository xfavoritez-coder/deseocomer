"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MenuRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/panel/mi-local"); }, [router]);
  return null;
}
