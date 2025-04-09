// app/productos/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { getProductos } from "@/lib/productos";
import { useEffect, useState } from "react";

interface Producto {
  id_sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  disponible: boolean;
  especificaciones: {
    viscosidad?: string;
    capacidad?: string;
    [key: string]: any;
  };
  marca: string;
  subcategoria: string;
  categoria: string;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await getProductos();
        setProductos(data);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Catálogo de Productos</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-full">
              <div className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Catálogo de Productos</h1>
      
      {productos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron productos disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <Card key={producto.id_sku} className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{producto.nombre}</CardTitle>
              </CardHeader>
              
              <CardContent className="flex-grow space-y-3">
                <div className="relative mx-auto w-40 h-40 bg-gray-100 rounded-md mb-3">
                  <Image
                    src={producto.imagen_url || '/placeholder-product.jpg'}
                    alt={producto.nombre}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Marca:</span>
                    <span>{producto.marca}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">SKU:</span>
                    <span className="font-mono">#{producto.id_sku}</span>
                  </div>
                  
                  {producto.especificaciones?.viscosidad && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Viscosidad:</span>
                      <span>{producto.especificaciones.viscosidad}</span>
                    </div>
                  )}
                  
                  {producto.especificaciones?.capacidad && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Capacidad:</span>
                      <span>{producto.especificaciones.capacidad}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Categoría:</span>
                    <span className="text-right">
                      {producto.categoria && producto.subcategoria 
                        ? `${producto.categoria} › ${producto.subcategoria}`
                        : 'Sin categoría'}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                  {producto.descripcion}
                </p>
                
                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                  <span className="text-lg font-bold text-blue-600">
                    ${producto.precio.toLocaleString('es-MX')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      producto.disponible 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {producto.disponible ? 'Disponible' : 'Agotado'}
                    </span>
                    <button 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      aria-label="Agregar al carrito"
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