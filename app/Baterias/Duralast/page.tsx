"use client";

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation' // Cambiado de useRouter a useParams
//import { PostgrestError } from '@supabase/supabase-js'

type CategoriaMain = {
  id_categoria_main: number;
  nombre: string;
  slug: string;
  descripcion?: string; // Opcional según tu DB
  imagen_url?: string;  // Opcional según tu DB
};

type Subcategoria1 = {
  id_subcategoria1: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  imagen_url?: string;
  categoria_main: CategoriaMain; // Relación con nombre corregido
};

type Subcategoria2 = {
  id_subcategoria2: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  imagen_url?: string;
  subcategoria_nivel1: Subcategoria1; // Relación con nombre corregido
};

type Marca = {
  id_marca: number;
  nombre: string;
  slug: string;
  logo_url?: string;
  descripcion?: string;
};

type Producto = {
  id_sku: string; // Corregido a string
  nombre: string;
  slug: string;
  imagen_principal: string;
  descripcion: string;
  precio: number;
  existencias: number;
  id_marca: Marca;
  subcategoria_nivel2: Subcategoria2; // Nombre corregido para coincidir con la consulta
  activo?: boolean;     // Campos adicionales de tu DB
  destacado?: boolean;
};

export default function BateriasMarca() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();

  console.log('1 - Parámetros de ruta:', params); // Debug 1

  const marca = params.marca as string;
  console.log('2 - Marca extraída:', marca); // Debug 2

  useEffect(() => {
    console.log('3 - Iniciando useEffect, marca:', marca); // Debug 3

    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('4 - Iniciando carga de productos...'); // Debug 4
        
        console.log('5 - Realizando consulta a Supabase...'); // Debug 5
        const { data, error: supabaseError } = await supabase
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
          .eq('subcategoria_nivel2.nombre', 'Baterias')
          .eq('marcas.nombre', marca)
          .order('nombre', { ascending: true });

        console.log('6 - Consulta completada, resultado:', { data, error: supabaseError }); // Debug 6

        if (supabaseError) {
          console.error('7 - Error de Supabase:', supabaseError); // Debug 7
          throw supabaseError;
        }

        if (!data || data.length === 0) {
          console.warn('8 - No se encontraron productos'); // Debug 8
          setError(`No se encontraron baterías de la marca ${marca}`);
        } else {
          console.log('9 - Productos encontrados:', data); // Debug 9
          setProductos(data);
        }
      } catch (err) {
        console.error('10 - Error en cargaProductos:', err); // Debug 10
        setError('Error al cargar los productos');
      } finally {
        console.log('11 - Finalizando carga (finally)'); // Debug 11
        setLoading(false);
      }
    };

    if (marca) {
      console.log('12 - Marca válida, ejecutando cargarProductos'); // Debug 12
      cargarProductos();
    } else {
      console.log('13 - No hay marca definida'); // Debug 13
      setLoading(false);
    }
  }, [marca]);
}
  console.log('14 - Estado actual:', { loading, productos, error }); // Debug 14

  if (loading) {
    console.log('15 - Mostrando estado de carga...'); // Debug 15

    console.log('17 - Renderizando productos...'); // Debug 17
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Baterías {marca}</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {productos.map((producto) => (
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
                  {producto.subcategoria_nivel2.subcategoria_nivel1.categoria_main.nombre}{' > '}
                  {producto.subcategoria_nivel2.subcategoria_nivel1.nombre}{' > '}
                  {producto.subcategoria_nivel2.nombre}
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