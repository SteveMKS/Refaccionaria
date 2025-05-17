import { Suspense } from "react";
import SuccessPageClient from "./SuccessPageClient";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Cargando detalles...</div>}>
      <SuccessPageClient />
    </Suspense>
  );
}
