"use client";

import ScannerRedirect from "@/components/ScannerRedirect";

export default function ScanPage() {
  return (
    <div className="h-screen flex flex-col justify-center items-center text-center">
      <h1 className="text-2xl font-semibold mb-4">Escanea el ticket</h1>
      <p className="text-gray-600">Apunta el escáner al código QR o código de barras.</p>
      <ScannerRedirect /> {/* Este componente se encarga de leer y redirigir */}
    </div>
  );
}
