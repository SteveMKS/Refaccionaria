"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const productSchema = z.object({
  id_sku: z.string().min(1, "El SKU es obligatorio"),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
  precio: z.number().positive("El precio debe ser mayor a 0"),
  existencias: z.number().int().min(0, "Las existencias no pueden ser negativas"),
  imagen_url: z.string().url("Debe ser una URL válida"),
});

type ProductData = z.infer<typeof productSchema>;

export default function AddProductForm() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductData>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (data: ProductData) => {
    setSuccessMessage("");
    setErrorMessage("");

    const confirm = window.confirm("¿Seguro que deseas agregar este producto?");
    if (!confirm) return;

    try {
      const response = await fetch("/api/Productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al agregar el producto");
      }

      setSuccessMessage("Producto agregado exitosamente");
      reset();
    } catch (error) {
      setErrorMessage("Ocurrió un error al agregar el producto");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-4">Agregar Producto</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block font-semibold">SKU:</label>
          <input
            {...register("id_sku")}
            type="text"
            className="w-full p-2 border rounded"
          />
          {errors.id_sku && <p className="text-red-500">{errors.id_sku.message}</p>}
        </div>

        <div>
          <label className="block font-semibold">Nombre:</label>
          <input
            {...register("nombre")}
            type="text"
            className="w-full p-2 border rounded"
          />
          {errors.nombre && <p className="text-red-500">{errors.nombre.message}</p>}
        </div>

        <div>
          <label className="block font-semibold">Descripción:</label>
          <textarea
            {...register("descripcion")}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Precio:</label>
          <input
            {...register("precio", { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="w-full p-2 border rounded"
          />
          {errors.precio && <p className="text-red-500">{errors.precio.message}</p>}
        </div>

        <div>
          <label className="block font-semibold">Existencias:</label>
          <input
            {...register("existencias", { valueAsNumber: true })}
            type="number"
            className="w-full p-2 border rounded"
          />
          {errors.existencias && <p className="text-red-500">{errors.existencias.message}</p>}
        </div>

        <div>
          <label className="block font-semibold">Imagen URL:</label>
          <input
            {...register("imagen_url")}
            type="text"
            className="w-full p-2 border rounded"
          />
          {errors.imagen_url && <p className="text-red-500">{errors.imagen_url.message}</p>}
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Agregando..." : "Agregar Producto"}
        </button>

        {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}
        {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}
      </form>
    </div>
  );
}
