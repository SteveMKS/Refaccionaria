"use client";

import { useState } from "react";

export default function AgregarProducto() {
  const [producto, setProducto] = useState({
    numero_parte: "",
    id_subcategoria3: 0,
    id_marca: 0,
    id_sku: "",
    nombre: "",
    descripcion: "",
    precio: 0,
    existencias: 0,
    imagen_url: "",
  });

  const [mensaje, setMensaje] = useState<string | null>(null);

  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setProducto((prev) => ({
      ...prev,
      [name]: ["id_subcategoria3", "id_marca", "precio", "existencias"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    try {
      const response = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("✅ Producto agregado correctamente");
        setProducto({
          numero_parte: "",
          id_subcategoria3: 0,
          id_marca: 0,
          id_sku: "",
          nombre: "",
          descripcion: "",
          precio: 0,
          existencias: 0,
          imagen_url: "",
        });
      } else {
        setMensaje(`❌ Error: ${data.error || "No se pudo agregar el producto"}`);
      }
    } catch (error) {
      setMensaje("❌ Error de conexión con el servidor");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Agregar Producto</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="numero_parte" placeholder="Número de parte" value={producto.numero_parte} onChange={handleChange} className="w-full p-2 border rounded" required />

        <input type="number" name="id_subcategoria3" placeholder="ID Subcategoría 3" value={producto.id_subcategoria3} onChange={handleChange} className="w-full p-2 border rounded" required />

        <input type="number" name="id_marca" placeholder="ID Marca" value={producto.id_marca} onChange={handleChange} className="w-full p-2 border rounded" required />

        <input type="text" name="id_sku" placeholder="SKU" value={producto.id_sku} onChange={handleChange} className="w-full p-2 border rounded" required />

        <input type="text" name="nombre" placeholder="Nombre del producto" value={producto.nombre} onChange={handleChange} className="w-full p-2 border rounded" required />

        <textarea name="descripcion" placeholder="Descripción" value={producto.descripcion} onChange={handleChange} className="w-full p-2 border rounded" />

        <input type="number" name="precio" placeholder="Precio" value={producto.precio} onChange={handleChange} className="w-full p-2 border rounded" required />

        <input type="number" name="existencias" placeholder="Existencias" value={producto.existencias} onChange={handleChange} className="w-full p-2 border rounded" required />

        <input type="text" name="imagen_url" placeholder="URL de la imagen" value={producto.imagen_url} onChange={handleChange} className="w-full p-2 border rounded" required />

        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Agregar Producto</button>
      </form>

      {mensaje && <p className="mt-4 text-center font-semibold">{mensaje}</p>}
    </div>
  );
}
