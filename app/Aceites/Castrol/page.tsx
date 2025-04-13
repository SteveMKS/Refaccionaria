"use client";

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PostgrestError } from '@supabase/supabase-js'

// Definición de tipos FUERA del componente
type CategoriaMain = {
  id: number;
  nombre: string;
};

type Subcategoria1 = {
  id: number;
  nombre: string;
  id_categoria_main: CategoriaMain;
};

type Subcategoria2 = {
  id: number;
  nombre: string;
  id_subcategoria1: Subcategoria1;
};

type Marca = {
  id: number;
  nombre: string;
};

type Producto = {
  id: number;
  nombre: string;
  slug: string;
  imagen_principal: string;
  descripcion: string;
  precio: number;
  existencias: number;
  id_marca: Marca;
  id_subcategoria2: Subcategoria2;
};

export default function Producto() {
  const [producto, setProducto] = useState<Producto | null>(null); // <-- Cambio clave aquí
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { slug } = router.query
  
  useEffect(() => {
    const cargarProducto = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('productos')
          .select(`
            *,
            marcas: id_marca (*),
            subcategoria: id_subcategoria2 (
              *,
              subcategoria_padre: id_subcategoria1 (
                *,
                categoria_padre: id_categoria_main (*)
              )
            )
          `)
          .eq('slug', slug)
          .single();
  
        if (error) throw error;
        
        if (!data) {
          throw new Error('No se encontró el producto');
        }
  
        setProducto(data); // <-- Ya no necesitas el "as Producto"
  
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error cargando producto:', error.message);
        } else {
          console.error('Error inesperado:', error);
        }
      } finally {
        setLoading(false);
      }
    };
  
    if (slug) cargarProducto(); // <-- Añadí validación de slug
  }, [slug]);

  if (loading) return <div>Cargando...</div>
  if (!producto) return <div>Producto no encontrado</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <img 
            src={producto.imagen_principal} 
            alt={producto.nombre}
            className="w-full rounded-lg"
          />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-2">{producto.nombre}</h1>
          
          <div className="text-sm text-gray-500 mb-4">
            {producto.id_subcategoria2.id_subcategoria1.id_categoria_main.nombre}{' > '}
            {producto.id_subcategoria2.id_subcategoria1.nombre}{' > '}
            {producto.id_subcategoria2.nombre}
          </div>
          
          <div className="mb-4">
            <span className="font-semibold">Marca:</span> {producto.id_marca.nombre}
          </div>
          
          <div className="text-2xl font-bold mb-4">${producto.precio.toFixed(2)}</div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Descripción</h2>
            <p>{producto.descripcion}</p>
          </div>
          
          <div className="mb-6">
            <span className="font-semibold">Disponibilidad:</span> 
            {producto.existencias > 0 
              ? <span className="text-green-600"> En stock ({producto.existencias} unidades)</span>
              : <span className="text-red-600"> Agotado</span>
            }
          </div>
          
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
            disabled={producto.existencias <= 0}
          >
            {producto.existencias > 0 ? 'Añadir al carrito' : 'No disponible'}
          </button>
        </div>
      </div>
    </div>
  )
}