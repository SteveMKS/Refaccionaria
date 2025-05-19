// components/BusquedaBar.tsx
"use client";

import { useBusqueda } from "@/components/Busqueda/BusquedaContext";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface BusquedaBarProps {
  placeholder?: string;
  resetPage?: () => void;
}

export const BusquedaBar = ({ placeholder = "Buscar productos...", resetPage }: BusquedaBarProps) => {
  const { busqueda, setBusqueda } = useBusqueda();
  const [valor, setValor] = useState(busqueda);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusqueda(valor);
      if (resetPage) resetPage();
    }, 300); // debounce 300ms

    return () => clearTimeout(timeout);
  }, [valor]);

  return (
    <Input
      type="search"
      placeholder={placeholder}
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      className="max-w-sm"
    />
  );
};
