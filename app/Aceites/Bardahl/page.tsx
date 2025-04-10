import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ListaProductos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('productos')
          .select('id_sku, nombre, slug, precio, imagen_principal, existencias')
          .eq('activo', true)
          .order('fecha_creacion', { ascending: false })

        if (error) throw error
        setProductos(data)
      } catch (error) {
        console.error('Error cargando productos:', error.message)
      } finally {
        setLoading(false)
      }
    }

    cargarProductos()
  }, [])

  if (loading) return <div>Cargando productos...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Nuestros Productos</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productos.map(producto => (
          <Link key={producto.id_sku} href={`/productos/${producto.slug}`}>
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <img 
                src={producto.imagen_principal} 
                alt={producto.nombre}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{producto.nombre}</h3>
                <p className="text-gray-600 mb-2">${producto.precio.toFixed(2)}</p>
                <p className={`text-sm ${
                  producto.existencias > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {producto.existencias > 0 ? 'En stock' : 'Agotado'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}