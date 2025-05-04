"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase-browser";
import { debounce } from "lodash";

// Tipos
type Marca = {
  id_marca: string;
  nombre: string;
  descripcion: string;
};

type Producto = {
  id_sku: string;
  nombre: string;
  imagen_principal: string;
  descripcion: string;
  precio: number;
  existencias: number;
  marcas?: Marca;
};

export function LiveSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);

  const search = debounce(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("productos")
      .select(`
        id_sku,
        nombre,
        imagen_principal,
        descripcion,
        precio,
        existencias,
        marcas:marcas (
          id_marca,
          nombre,
          descripcion
        )
      `)
      .or(`
        nombre.ilike.%${q}%, 
        descripcion.ilike.%${q}%, 
        marcas.nombre.ilike.%${q}%
      `)
      .limit(10);

    if (error) {
      console.error("Error en búsqueda:", error);
      setResults([]);
    } else {
      // Mapeo para asegurarse de que 'marcas' sea un solo objeto
      const mappedData = (data || []).map((producto) => ({
        ...producto,
        marcas: Array.isArray(producto.marcas) ? producto.marcas[0] : producto.marcas, // Asegura que marcas sea un objeto, no un array
      }));

      setResults(mappedData); // Actualizamos los resultados con el mapeo
    }

    setLoading(false);
  }, 300); // Espera 300ms después de escribir

  useEffect(() => {
    search(query);
    return () => search.cancel();
  }, [query]);

  return (
    <div className="w-full max-w-xl mx-auto p-4 space-y-4">
      <Input
        type="text"
        placeholder="Buscar productos o marcas..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <p className="text-sm text-gray-500">Buscando...</p>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((producto) => (
            <Card key={producto.id_sku} className="p-4">
              <h2 className="font-semibold">{producto.nombre}</h2>
              <p className="text-sm text-gray-700">{producto.descripcion}</p>
              <p className="text-sm">Marca: {producto.marcas?.nombre || "Sin marca"}</p>
              <p className="text-sm font-medium">Precio: ${producto.precio}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
