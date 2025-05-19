"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Cart } from "@/components/cart/Cart";
import { useCart } from "@/components/cart/useCart";
import { Button } from "@/components/ui/button";

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

const PAGE_SIZE = 6;

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


useEffect(() => {
  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);

      const pageSize = 9;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("productos")
        .select(
          `
          *,
          id_marca (
            id_marca,
            nombre,
            descripcion
          )
        `,
          { count: "exact" }
        )
        .eq("activo", true)
        .eq("id_marca", "e50868cc-ef7f-44f8-9e47-885aa04e8b16")
        .order("nombre", { ascending: true })
        .range(from, to);

      if (busqueda.trim() !== "") {
        query = query.or(
          `nombre.ilike.%${busqueda}%,id_sku.ilike.%${busqueda}%,num_parte.ilike.%${busqueda}%`
        );
      }

      const { data, count, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      setProductos(data || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  cargarProductos();
}, [busqueda, page]);

  const handleAddToCart = async (producto: Producto) => {
    setAddingProductId(producto.id_sku);
    setSuccessMessage(null);

    if (producto.existencias <= 0) {
      setErrorMessage("Este producto está agotado.");
      setTimeout(() => setErrorMessage(null), 3000);
      setAddingProductId(null);
      return;
    }

    await addToCart({
      imagen_principal: producto.imagen_principal,
      id: producto.id_sku,
      name: producto.nombre,
      descripcion: producto.descripcion,
      price: producto.precio,
    });

    setSuccessMessage(`"${producto.nombre}" agregado al carrito.`);
    setTimeout(() => {
      setSuccessMessage(null);
      setAddingProductId(null);
    }, 1500);
  };

  const totalPaginas = Math.ceil(total / PAGE_SIZE);
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
        <Cart />
      </div>

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

{/* 🔍 Input de búsqueda */}
<div className="mb-6">
  <input
    type="text"
    placeholder="Buscar por nombre, SKU o número de parte..."
    value={busqueda}
    onChange={(e) => {
      setBusqueda(e.target.value);
      setPage(1); // 🔁 reinicia la paginación al hacer una nueva búsqueda
    }}
    className="w-full border border-gray-300 rounded px-4 py-2 shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
  />
</div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
          <span className="ml-2 text-blue-500 font-medium">Cargando productos...</span>
        </div>
      ) : (
        <>
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

                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span>Marca:</span><span>{producto.id_marca.nombre}</span></div>
                    <div className="flex justify-between"><span>SKU:</span><span>{producto.id_sku}</span></div>
                    <div className="flex justify-between"><span>Existencias:</span><span>{producto.existencias}</span></div>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                    {producto.descripcion}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t">
                    <span className="text-lg font-bold text-blue-600">
                      ${producto.precio.toLocaleString("es-MX")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        producto.existencias > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {producto.existencias > 0 ? "Disponible" : "Agotado"}
                      </span>
                      <button
                        className={`p-2 rounded-full ${
                          producto.existencias <= 0
                            ? "text-gray-400 cursor-not-allowed bg-gray-100"
                            : "text-blue-600 hover:bg-blue-50"
                        }`}
                        onClick={() => handleAddToCart(producto)}
                        disabled={producto.existencias <= 0}
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

          {/* Paginación */}
          <div className="flex justify-center items-center mt-6 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
              disabled={paginaActual === 1}
            >
              Anterior
            </Button>
            {paginas.map(num => (
              <Button
                key={num}
                size="sm"
                variant={paginaActual === num ? "default" : "outline"}
                onClick={() => setPaginaActual(num)}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
