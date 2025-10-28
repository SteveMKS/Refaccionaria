"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Cart } from "@/components/cart/Cart";
import { useCart } from "@/components/cart/useCart";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider/Auth";

// Definición de tipos
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
};

export default function ProductosPage() {
  // Estados
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Hooks
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Efectos
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from("productos")
          .select(`*,
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
          .eq("id_marca", "dc35e8be-98a7-4519-a9f2-b826205f939e")
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

  // Handlers
  const handleAddToCart = async (producto: Producto) => {
    if (!user) {
      setErrorMessage("Debes iniciar sesión para agregar productos.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setAddingProductId(producto.id_sku);
    setSuccessMessage(null);

    if (producto.existencias <= 0) {
      setErrorMessage("Este producto está agotado.");
      setTimeout(() => setErrorMessage(null), 3000);
      setAddingProductId(null);
      return;
    }

    const added = await addToCart({
      imagen_principal: producto.imagen_principal,
      id: producto.id_sku,
      name: producto.nombre,
      descripcion: producto.descripcion,
      price: producto.precio,
    });

    if (!added) {
      setAddingProductId(null);
      return;
    }

    setSuccessMessage(`"${producto.nombre}" agregado al carrito.`);
    
    setTimeout(() => {
      setSuccessMessage(null);
      setAddingProductId(null);
    }, 1500);
  };

  // Render
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
        <Cart />
      </div>

      {/* Mensajes de estado */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">
          {errorMessage}
        </div>
      )}

      {/* Estado de carga */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
          <span className="ml-2 text-blue-500 font-medium">Cargando productos...</span>
        </div>
      )}

      {/* Lista de productos */}
      {!loading && !error && (
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

                {/* Detalles del producto */}
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

                {/* Precio y acciones */}
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
                      className={`p-2 rounded-full transition-colors ${
                        producto.existencias <= 0
                          ? "text-gray-400 cursor-not-allowed bg-gray-100"
                          : "text-blue-600 hover:bg-blue-50"
                      }`}
                      aria-label="Agregar al carrito"
                      onClick={() => handleAddToCart(producto)}
                    >
                      {addingProductId === producto.id_sku ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                      ) : (
                        <ShoppingCart className="h-5 w-5" />
                      )}
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