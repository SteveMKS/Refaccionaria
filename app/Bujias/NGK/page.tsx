"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";

// Definición del tipo Producto para datos reales desde Supabase
type Producto = {
  id_sku: string;
  id_marca: string;
  nombre: string;
  slug: string;
  imagen_principal: string;
  descripcion: string;
  precio: number;
  existencias: number;
  activo?: boolean;
  destacado?: boolean;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
        .from("pruebaproducts")
        .select(`
          *,
          id_marca (
            id_marca,
            nombre,
            slug,
            descripcion
          ),
          id_subcategoria (
            id_subcategoria,
            nombre,
            descripcion,
            id_categoria (
              id_categoria,
              nombre,
              descripcion,
              id_categoria_main (
                id_categoria_main,
                nombre,
                descripcion
              )
            )
          )
        `)
        .order("nombre", { ascending: true });      

        if (supabaseError) throw supabaseError;
        if (!data || data.length === 0) {
          throw new Error("No se encontraron productos");
        }

        setProductos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mr-4"></div>
        <span>Cargando productos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Catálogo de Productos</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productos.map((producto) => (
          <Card key={producto.id_sku} className="hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{producto.nombre}</CardTitle>
            </CardHeader>

            <CardContent className="flex-grow space-y-3">
              {/* Imagen del producto */}
              <div className="relative mx-auto w-40 h-40 bg-gray-100 rounded-md mb-3">
                <Image
                  src={producto.imagen_principal}
                  alt={producto.nombre}
                  fill
                  className="object-contain p-3"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              {/* Marca */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Marca:</span>
                  <span className="font-mono">#{producto.id_marca.nombre}</span>
                </div>
              </div>

              {/* SKU */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">SKU:</span>
                  <span className="font-mono">#{producto.id_sku}</span>
                </div>
              </div>
              
              {/* Cantidad */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Cantidad:</span>
                  <span className="font-mono">#{producto.existencias}</span>
                </div>
              </div>

              {/* Descripción */}
              <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                {producto.descripcion}
              </p>

              {/* Precio y botón */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t">
                <span className="text-lg font-bold text-blue-600">
                  ${producto.precio.toLocaleString("es-MX")}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      producto.existencias > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {producto.existencias > 0 ? "Disponible" : "Agotado"}
                  </span>
                  <button
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    aria-label="Agregar al carrito"
                    disabled={producto.existencias <= 0}
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}