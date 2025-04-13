"use client";

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation' // Cambiado de useRouter a useParams
//import { PostgrestError } from '@supabase/supabase-js'

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

// 2. Define el tipo Marca que falta
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

export default function BateriasMarca() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const marca = params.marca as string; // "Duralast" en tu URL

  useEffect(() => {
    const cargarProductos = async () => {
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
          // Filtros corregidos:
          .eq('id_subcategoria2.nombre', 'Baterias') // Filtra por categoría
          .eq('id_marca.nombre', marca) // Filtra por marca (usa la variable)
          .order('nombre', { ascending: true });

        if (error) throw error;
        
        setProductos(data || []);
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (marca) cargarProductos();
  }, [marca]);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <img 
            src={productos.imagen_principal} 
            alt={productos.nombre}
            className="w-full rounded-lg"
          />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-2">{producto.nombre}</h1>
          
          <div className="text-sm text-gray-500 mb-4">
            {productos.id_subcategoria2.id_subcategoria1.id_categoria_main.nombre}{' > '}
            {productos.id_subcategoria2.id_subcategoria1.nombre}{' > '}
            {productos.id_subcategoria2.nombre}
          </div>
          
          <div className="mb-4">
            <span className="font-semibold">Marca:</span> {productos.id_marca.nombre}
          </div>
          
          <div className="text-2xl font-bold mb-4">${productos.precio.toFixed(2)}</div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Descripción</h2>
            <p>{productos.descripcion}</p>
          </div>
          
          <div className="mb-6">
            <span className="font-semibold">Disponibilidad:</span> 
            {productos.existencias > 0 
              ? <span className="text-green-600"> En stock ({productos.existencias} unidades)</span>
              : <span className="text-red-600"> Agotado</span>
            }
          </div>
          
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
            disabled={productos.existencias <= 0}
          >
            {productos.existencias > 0 ? 'Añadir al carrito' : 'No disponible'}
          </button>
        </div>
      </div>
    </div>
  )
}