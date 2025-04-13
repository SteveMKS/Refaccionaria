"use client";

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation' // Cambiado de useRouter a useParams
import { PostgrestError } from '@supabase/supabase-js'

// Definición de tipos (igual que antes)
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
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams(); // Cambiado a useParams
  const slug = params.slug as string; // Obtenemos el slug directamente de params

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
        if (!data) throw new Error('No se encontró el producto');
        
        setProducto(data);
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

    if (slug) cargarProducto();
  }, [slug]);

  if (loading) return <div>Cargando...</div>;
  if (!producto) return <div>Producto no encontrado</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... (resto del JSX igual) ... */}
    </div>
  );
}