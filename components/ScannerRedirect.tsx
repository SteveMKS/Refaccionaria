"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ScannerRedirect() {
  const [value, setValue] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const trimmed = value.trim();

      if (trimmed.length > 0) {
        // Eliminar todos los caracteres no hexadecimales
        const onlyHex = trimmed.replace(/[^a-fA-F0-9]/g, "");

        // Formatear el UUID con guiones
        const formattedUUID = onlyHex.replace(
          /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
          "$1-$2-$3-$4-$5"
        );

        if (isValidUUID(formattedUUID)) {
          router.push(`/recibos/${formattedUUID}`);
        } else {
          toast.error("Código escaneado no válido");
          console.error("UUID no válido:", trimmed);
        }
      }

      setValue(""); // Limpiar campo
    }
  };

  const isValidUUID = (id: string) => {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(id);
  };

  return (
    <div className="w-full flex justify-center mt-10">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleSubmit}
        placeholder="Escanea o escribe el código"
        className="border px-4 py-2 rounded-md w-[400px] shadow"
        autoFocus
      />
    </div>
  );
}
