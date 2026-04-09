"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is no longer used. Password reset is handled via OTP on the login page.
export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return null;
}
