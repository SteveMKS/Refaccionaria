"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Cart } from "@/components/cart/Cart";
import { useCart } from "@/components/cart/useCart";

// Tipos
interface CategoriaMain {
  id_categoria_main: string;
  nombre: string;
}

interface Categoria {
  id_categoria: string;
  nombre: string;
}

interface Subcategoria {
  id_subcategoria: string;
  nombre: string;
}

interface Subsubcategoria {
  id_subsubcategoria: string;
  nombre: string;
}

interface Marca {
  id_marca: string;
  nombre: string;
}

interface Producto {
  id_sku: string;
  id_marca: Marca;
  nombre: string;
  imagen_principal: string;
  descripcion: string;
  precio: number;
  existencias: number;
}

export default function RefaccionesPage() {
  const [nivel, setNivel] = useState<number>(1);
  const [categoriaMain, setCategoriaMain] = useState<CategoriaMain[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState<string | null>(null);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [subsubcategoriaSeleccionada, setSubsubcategoriaSeleccionada] = useState<string | null>(null);
  const [subsubcategorias, setSubsubcategorias] = useState<Subsubcategoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    const cargarCategoriaMain = async () => {
      const { data } = await supabase.from("categoria_main").select("id_categoria_main, nombre").order("nombre");
      if (data) setCategoriaMain(data);
    };
    cargarCategoriaMain();
  }, []);

  useEffect(() => {
    if (categoriaSeleccionada) {
      const cargarCategorias = async () => {
        const { data } = await supabase
          .from("categorias")
          .select("id_categoria, nombre")
          .eq("id_categoria_main", categoriaSeleccionada)
          .order("nombre");
        if (data) setCategorias(data);
      };
      cargarCategorias();
    }
  }, [categoriaSeleccionada]);

  useEffect(() => {
    if (subcategoriaSeleccionada) {
      const cargarSubcategorias = async () => {
        const { data } = await supabase
          .from("subcategorias")
          .select("id_subcategoria, nombre")
          .eq("id_categoria", subcategoriaSeleccionada)
          .order("nombre");
        if (data) setSubcategorias(data);
      };
      cargarSubcategorias();
    }
  }, [subcategoriaSeleccionada]);

  useEffect(() => {
    if (subsubcategoriaSeleccionada) {
      const cargarSubsubcategorias = async () => {
        const { data } = await supabase
          .from("subsubcategorias")
          .select("id_subsubcategoria, nombre")
          .eq("id_subcategoria", subsubcategoriaSeleccionada)
          .order("nombre");
        if (data) setSubsubcategorias(data);
      };
      cargarSubsubcategorias();
    }
  }, [subsubcategoriaSeleccionada]);

  useEffect(() => {
    const cargarProductos = async () => {
      if (nivel === 5 && subsubcategoriaSeleccionada) {
        const { data } = await supabase
          .from("productos")
          .select("*, id_marca(id_marca, nombre)")
          .eq("id_subsubcategoria", subsubcategoriaSeleccionada)
          .order("nombre");
        if (data) setProductos(data);
      }
    };
    cargarProductos();
  }, [nivel, subsubcategoriaSeleccionada]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Refacciones</h1>
        <Cart />
      </div>

      {nivel === 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoriaMain.map((cat) => (
            <Card key={cat.id_categoria_main} onClick={() => { setCategoriaSeleccionada(cat.id_categoria_main); setNivel(2); }} className="cursor-pointer hover:shadow-md">
              <CardContent className="p-4 text-center">{cat.nombre}</CardContent>
            </Card>
          ))}
        </div>
      )}

      {nivel === 2 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categorias.map((cat) => (
            <Card key={cat.id_categoria} onClick={() => { setSubcategoriaSeleccionada(cat.id_categoria); setNivel(3); }} className="cursor-pointer hover:shadow-md">
              <CardContent className="p-4 text-center">{cat.nombre}</CardContent>
            </Card>
          ))}
        </div>
      )}

      {nivel === 3 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {subcategorias.map((sub) => (
            <Card key={sub.id_subcategoria} onClick={() => { setSubsubcategoriaSeleccionada(sub.id_subcategoria); setNivel(4); }} className="cursor-pointer hover:shadow-md">
              <CardContent className="p-4 text-center">{sub.nombre}</CardContent>
            </Card>
          ))}
        </div>
      )}

      {nivel === 4 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {subsubcategorias.map((subsub) => (
            <Card key={subsub.id_subsubcategoria} onClick={() => { setSubsubcategoriaSeleccionada(subsub.id_subsubcategoria); setNivel(5); }} className="cursor-pointer hover:shadow-md">
              <CardContent className="p-4 text-center">{subsub.nombre}</CardContent>
            </Card>
          ))}
        </div>
      )}

      {nivel === 5 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">SKU:</span>
                    <span className="font-mono">#{producto.id_sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Cantidad:</span>
                    <span className="font-mono">#{producto.existencias}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 mt-2">{producto.descripcion}</p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                  <span className="text-lg font-bold text-blue-600">${producto.precio.toLocaleString("es-MX")}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${producto.existencias > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {producto.existencias > 0 ? "Disponible" : "Agotado"}
                    </span>
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      aria-label="Agregar al carrito"
                      disabled={producto.existencias <= 0}
                      onClick={async () => { await addToCart({
                        imagen_principal: producto.imagen_principal,
                        id: producto.id_sku,
                        name: producto.nombre,
                        descripcion: producto.descripcion,
                        price: producto.precio,
                      }); }}
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
