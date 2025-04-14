"use client";

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

// Definición del tipo Producto simplificado para PruebaProducts
type Producto = {
  id_sku: string;
  nombre: string;
  slug: string;
  imagen_principal: string;
  descripcion: string;
  precio: number;
  existencias: number;
  id_marca: number; // Solo el ID ya que no hay relación
  activo?: boolean;
  destacado?: boolean;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Consulta directa a la tabla PruebaProducts
        const { data, error: supabaseError } = await supabase
          .from('PruebaProducts')
          .select('*')
          .order('nombre', { ascending: true });

        console.log('Resultado de la consulta:', { data, error: supabaseError });

        if (supabaseError) throw supabaseError;
        if (!data || data.length === 0) {
          throw new Error('No se encontraron productos');
        }

        setProductos(data);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-4">Cargando productos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Nuestros Productos</h1>
      
      {productos.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No se encontraron productos
        </div>
      ) : (
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
                  
                  <div className="mb-4">
                    <span className="font-semibold">Código SKU:</span> {producto.id_sku}
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
      )}
    </div>
  );
}