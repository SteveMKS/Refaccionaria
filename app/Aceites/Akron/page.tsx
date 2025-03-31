"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    const obtenerProductos = async () => {
      const res = await fetch("/api/productos");
      const data = await res.json();
      setProductos(data);
    };

    obtenerProductos();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Aceites Disponibles</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productos.map((producto) => (
          <div key={producto.numero_parte} className="border p-4 rounded-lg shadow-lg">
            <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-40 object-cover mb-2 rounded-md" />
            <h2 className="text-lg font-semibold">{producto.nombre}</h2>
            <p className="text-sm text-gray-600">{producto.descripcion}</p>
            <p className="text-lg font-bold text-green-600">${producto.precio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
