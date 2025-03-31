"use client";
import { useState } from "react";

export default function AdminPage() {
  const [loading, setLoading] = useState(false);

  const agregarProducto = async () => {
    setLoading(true);
    const res = await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numero_parte: "ABC123",
        id_subcategoria3: 1,
        id_marca: 2,
        id_sku: "SKU12345",
        nombre: "Aceite Sintético 5W-30",
        descripcion: "Aceite para motor sintético premium.",
        precio: 450.00,
        existencias: 20,
        imagen_url: "https://example.com/imagen.jpg"
      }),
    });

    const data = await res.json();
    console.log(data);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Panel de Administración</h1>
      <button
        onClick={agregarProducto}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Agregando..." : "Agregar Producto"}
      </button>
    </div>
  );
}
