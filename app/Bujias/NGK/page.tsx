"use client";

import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Cart } from "@/components/cart/Cart";
import { useCart } from "@/hooks/useCart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Definición de tipos mejorada
type Marca = {
  id_marca: string;
  nombre: string;
  slug: string;
  descripcion: string;
};

type Subcategoria = {
  id_subcategoria: string;
  nombre: string;
  descripcion: string;
  id_categoria: {
    id_categoria: string;
    nombre: string;
    descripcion: string;
    id_categoria_main: {
      id_categoria_main: string;
      nombre: string;
      descripcion: string;
    };
  };
};

type Producto = {
  id_sku: string;
  id_marca: Marca;
  nombre: string;
  slug: string;
  imagen_principal: string;
  descripcion: string;
  precio: number;
  existencias: number;
  activo?: boolean;
  destacado?: boolean;
  id_subcategoria: Subcategoria;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const supabase = createClient();

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
        if (!data) throw new Error("No se encontraron productos");

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
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Catálogo de Productos</h1>
        <Cart />
      </div>

      {productos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map((producto) => (
            <Card key={producto.id_sku} className="hover:shadow-lg transition-shadow h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">
                  {producto.nombre}
                </CardTitle>
                <Badge variant="outline" className="w-fit">
                  {producto.id_marca.nombre}
                </Badge>
              </CardHeader>
            
              <CardContent className="flex-grow space-y-3">
                <div className="relative aspect-square w-full bg-gray-50 rounded-md overflow-hidden">
                  <Image
                    src={producto.imagen_principal}
                    alt={producto.nombre}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={productos.indexOf(producto) < 4}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-medium">{producto.id_sku}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Disponibles:</span>
                    <span className="font-medium">{producto.existencias}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Categoría:</span>
                    <span className="font-medium text-right line-clamp-1">
                      {producto.id_subcategoria.id_categoria.id_categoria_main.nombre} &gt; {producto.id_subcategoria.id_categoria.nombre}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3">
                  {producto.descripcion}
                </p>

                <div className="flex items-center justify-between pt-3 mt-auto">
                  <span className="text-xl font-bold">
                    ${producto.precio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                  <Button
                    size="sm"
                    variant={producto.existencias > 0 ? "default" : "outline"}
                    disabled={producto.existencias <= 0}
                    onClick={() => addToCart({
                      id: producto.id_sku,
                      name: producto.nombre,
                      price: producto.precio,
                      imagen_principal: producto.imagen_principal,
                      descripcion: producto.descripcion,
                    })}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {producto.existencias > 0 ? "Agregar" : "Agotado"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
/*"use client";

import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client' 

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Cart } from "@/components/cart/Cart"; // Importa el componente Cart
import { useCart } from "@/hooks/useCart"; // Importa el hook del carrito

// Definición del tipo Producto
type Marca = {
  id_marca: string;
  nombre: string;
  slug: string;
  descripcion: string;
};

type Producto = {
  id_sku: string;
  id_marca: Marca;
  nombre: string;
  slug: string;
  imagen_principal: string;
  descripcion: string;
  precio: number;
  existencias: number;
  activo?: boolean;
  destacado?: boolean;
};

const supabase = createClient()
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

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Añade el botón del carrito en la esquina superior derecha }
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
        <Cart /> {/* Componente del carrito }
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productos.map((producto) => (
          <Card key={producto.id_sku} className="hover:shadow-lg transition-shadow h-full flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{producto.nombre}</CardTitle>
          </CardHeader>
        
          <CardContent className="flex-grow space-y-3">
            {/* Imagen del producto }
            <div className="relative mx-auto w-40 h-40 bg-gray-100 rounded-md mb-3">
              <Image
                src={producto.imagen_principal}
                alt={producto.nombre}
                fill
                className="object-contain p-3"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
        
            {/* Marca }
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Marca:</span>
                <span className="font-mono">#{producto.id_marca.nombre}</span>
              </div>
            </div>
        
            {/* SKU *}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">SKU:</span>
                <span className="font-mono">#{producto.id_sku}</span>
              </div>
            </div>
            
            {/* Cantidad }
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Cantidad:</span>
                <span className="font-mono">#{producto.existencias}</span>
              </div>
            </div>
        
            {/* Descripción }
            <p className="text-xs text-gray-500 line-clamp-2 mt-2">
              {producto.descripcion}
            </p>
        
            {/* --- SECCIÓN MODIFICADA: Botón del carrito --- }
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
    </div>
  );
}*/
