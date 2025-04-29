"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPWForm";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div>Cargando formulario...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
