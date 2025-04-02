"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Producto {
  numero_parte: string;
  id_subcategoria3: number;
  id_marca: number;
  id_sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  existencias: number;
  imagen_url: string;
}

export default function AceitesPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const res = await fetch("/api/productos");

        if (!res.ok) throw new Error("Error al obtener los productos");

        const data = await res.json();

        if (!Array.isArray(data)) throw new Error("La API no devolvió un array");

        setProductos(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    obtenerProductos();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Aceites Disponibles</h1>

      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productos.map((producto) => (
          <div
            key={producto.numero_parte}
            className="border p-4 rounded-lg shadow-lg"
          >
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              width={300}
              height={160}
              className="w-full h-40 object-cover mb-2 rounded-md"
            />
            <h2 className="text-lg font-semibold">{producto.nombre}</h2>
            <p className="text-sm text-gray-600">{producto.descripcion}</p>
            <p className="text-lg font-bold text-green-600">${producto.precio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
