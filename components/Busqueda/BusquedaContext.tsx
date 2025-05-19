// context/BusquedaContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BusquedaContextProps {
  busqueda: string;
  setBusqueda: (value: string) => void;
}

const BusquedaContext = createContext<BusquedaContextProps | null>(null);

export const BusquedaProvider = ({ children }: { children: ReactNode }) => {
  const [busqueda, setBusqueda] = useState<string>("");

  return (
    <BusquedaContext.Provider value={{ busqueda, setBusqueda }}>
      {children}
    </BusquedaContext.Provider>
  );
};

export const useBusqueda = (): BusquedaContextProps => {
  const context = useContext(BusquedaContext);
  if (!context) {
    throw new Error("useBusqueda debe usarse dentro de BusquedaProvider");
  }
  return context;
};
