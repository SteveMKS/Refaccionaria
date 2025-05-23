"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Cart } from "@/components/cart/Cart";
import { useCart } from "@/components/cart/useCart";
import { Loader2 } from "lucide-react";

// Definición del tipo Producto
type Marca = {
  id_marca: string;
  nombre: string;
  descripcion: string;
};

type Producto = {
  id_sku: string;
  id_marca: Marca;
  nombre: string;
  imagen_principal: string;
  descripcion: string;
  precio: number;
  existencias: number;
  activo?: boolean;
  destacado?: boolean;
  //id_subsubcategoria?: string;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart(); // Usa el hook del carrito

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from("productos")
          .select(`
            *,
            id_marca (
              id_marca,
              nombre,
              descripcion
            ),
            id_subsubcategoria (
              id_subsubcategoria,
              nombre,
              descripcion,
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
            )
          `)
          .eq("id_marca", "00")
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
        <Cart />
      </div>

      {/* Manejo de loading */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
          <span className="ml-2 text-blue-500 font-medium">Cargando productos...</span>
        </div>
      )}

      {/* Manejo de error */}
      {error && (
        <div className="text-center text-red-600 font-semibold mt-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <Card key={producto.id_sku} className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{producto.nombre}</CardTitle>
              </CardHeader>

              <CardContent className="flex-grow space-y-3">
                <div className="relative mx-auto w-40 h-40 bg-gray-100 rounded-md mb-3">
                  <Image
                    src={producto.imagen_principal}
                    alt={producto.nombre}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Marca:</span>
                    <span className="font-mono">#{producto.id_marca.nombre}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">SKU:</span>
                    <span className="font-mono">#{producto.id_sku}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Cantidad:</span>
                    <span className="font-mono">#{producto.existencias}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                  {producto.descripcion}
                </p>

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
                      onClick={() => addToCart({
                        imagen_principal: producto.imagen_principal,
                        id: producto.id_sku,
                        name: producto.nombre,
                        descripcion: producto.descripcion,
                        price: producto.precio,
                      })}
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
