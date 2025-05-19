"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useCart } from "@/components/cart/useCart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Producto = {
  id_sku: string;
  nombre: string;
  num_parte: string;
  imagen_principal: string;
  descripcion: string;
  precio: number;
  existencias: number;
};

const PAGE_SIZE = 9;

export default function BuscarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim() !== "") {
        router.replace(`/buscar?q=${encodeURIComponent(query)}`, { scroll: false });
        fetchResultados();
      } else {
        setProductos([]);
      }
    }, 300); // debounce

    return () => clearTimeout(delayDebounce);
  }, [query, page]);

  const fetchResultados = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .or(`nombre.ilike.%${query}%,id_sku.ilike.%${query}%,num_parte.ilike.%${query}%`)
      .range(from, to);

    if (!error && data) setProductos(data);
    setLoading(false);
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Buscar por nombre, SKU o número de parte"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading && (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-blue-500">Buscando...</span>
        </div>
      )}

      {!loading && query && productos.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No se encontraron productos para: "{query}"</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                <div className="flex justify-between"><span>SKU:</span><span>{producto.id_sku}</span></div>
                <div className="flex justify-between"><span>No. Parte:</span><span>{producto.num_parte}</span></div>
                <div className="flex justify-between"><span>Existencias:</span><span>{producto.existencias}</span></div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mt-2">{producto.descripcion}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t">
                <span className="text-lg font-bold text-blue-600">
                  ${producto.precio.toLocaleString("es-MX")}
                </span>
                <Button
                  size="sm"
                  disabled={producto.existencias <= 0}
                  onClick={() => addToCart({
                    id: producto.id_sku,
                    name: producto.nombre,
                    price: producto.precio,
                    descripcion: producto.descripcion,
                    imagen_principal: producto.imagen_principal
                  })}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Añadir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginación */}
      {productos.length > 0 && (
        <div className="flex justify-center mt-8 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="px-4 py-1 text-sm">{page}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
