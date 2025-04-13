"use client";

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Producto() {
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { slug } = router.query

  import { PostgrestError } from '@supabase/supabase-js';

  // Define tipos para las relaciones
  type Marca = {
    id: number;
    nombre: string;
    // ... otras propiedades de marca
  };
  
  type CategoriaMain = {
    id: number;
    nombre: string;
    // ... otras propiedades de categoría principal
  };
  
  type Subcategoria1 = {
    id: number;
    nombre: string;
    id_categoria_main: CategoriaMain;
    // ... otras propiedades
  };
  
  type Subcategoria2 = {
    id: number;
    nombre: string;
    id_subcategoria1: Subcategoria1;
    // ... otras propiedades
  };
  
  type Producto = {
    id: number;
    nombre: string;
    slug: string;
    id_marca: Marca;
    id_subcategoria2: Subcategoria2;
    // ... otras propiedades del producto
  };
  
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
        
        // Validación de tipo para data
        if (!data) {
          throw new Error('No se encontró el producto');
        }
  
        // Aquí TypeScript ya sabe que data es de tipo Producto
        setProducto(data as Producto);
  
      } catch (error) {
        // Manejo seguro de errores
        if (typeof error === 'object' && error !== null && 'message' in error) {
          const err = error as PostgrestError | Error;
          console.error('Error cargando producto:', err.message);
          
          // Puedes acceder a propiedades específicas de PostgrestError
          if ('code' in err) {
            console.error('Código de error Supabase:', err.code);
          }
        } else {
          console.error('Error inesperado:', error);
        }
      } finally {
        setLoading(false);
      }
    };
  
    cargarProducto();
  }, [slug]);

  if (loading) return <div>Cargando...</div>
  if (!producto) return <div>Producto no encontrado</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Imagen del producto */}
        <div>
          <img 
            src={producto.imagen_principal} 
            alt={producto.nombre}
            className="w-full rounded-lg"
          />
        </div>
        
        {/* Información del producto */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{producto.nombre}</h1>
          
          {/* Ruta de categorías */}
          <div className="text-sm text-gray-500 mb-4">
            {producto.subcategoria.subcategoria_padre.categoria_padre.nombre}{' > '}
            {producto.subcategoria.subcategoria_padre.nombre}{' > '}
            {producto.subcategoria.nombre}
          </div>
          
          {/* Marca */}
          <div className="mb-4">
            <span className="font-semibold">Marca:</span> {producto.marcas.nombre}
          </div>
          
          {/* Precio */}
          <div className="text-2xl font-bold mb-4">${producto.precio.toFixed(2)}</div>
          
          {/* Descripción */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Descripción</h2>
            <p>{producto.descripcion}</p>
          </div>
          
          {/* Stock */}
          <div className="mb-6">
            <span className="font-semibold">Disponibilidad:</span> 
            {producto.existencias > 0 
              ? <span className="text-green-600"> En stock ({producto.existencias} unidades)</span>
              : <span className="text-red-600"> Agotado</span>
            }
          </div>
          
          {/* Botón de compra */}
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