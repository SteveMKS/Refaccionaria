"use client";

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation' // Cambiado de useRouter a useParams
//import { PostgrestError } from '@supabase/supabase-js'

type CategoriaMain = {
  id_categoria_main: number;
  nombre: string;
  slug: string;
};

type Subcategoria1 = {
  id_subcategoria1: number;
  nombre: string;
  slug: string;
  id_categoria_main: CategoriaMain;
};

type Subcategoria2 = {
  id_subcategoria2: number;
  nombre: string;
  slug: string;
  id_subcategoria1: Subcategoria1;
};

// 2. Define el tipo Marca que falta
type Marca = {
  id_marca: number;
  nombre: string;
  slug: string;
};

type Producto = {   
  id_sku: number;
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
  const marca = params.marca as string;

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('productos')
          .select(`
            *,
            marcas: id_marca (*),
            subcategoria_nivel2: id_subcategoria2 (
              *,
              subcategoria_nivel1: id_subcategoria1 (
                *,
                categoria_main: id_categoria_main (*)
              )
            )
          `)
          .eq('id_subcategoria2.nombre', 'Baterias')
          .eq('id_marca.nombre', marca)
          .order('nombre', { ascending: true });

        if (error) throw error;
        setProductos(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (marca) cargarProductos();
  }, [marca]);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Baterías {marca}</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {productos.map((producto) => ( // Mapea cada producto individual
          <div key={producto.id_sku} className="border rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <img 
                  src={producto.imagen_principal} 
                  alt={producto.nombre}
                  className="w-full rounded-lg"
                />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold mb-2">{producto.nombre}</h2>
                
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
                  <h3 className="text-xl font-semibold mb-2">Descripción</h3>
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
        ))}
      </div>
    </div>
  );
}