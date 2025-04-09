// app/lib/productos.ts
import { supabase } from '@/lib/supabase';

export async function getProductos() {
  const { data: productos, error } = await supabase
    .from('productos')
    .select(`
      id_sku,
      nombre,
      descripcion,
      precio,
      imagen_principal,
      activo,
      especificaciones,
      marcas(nombre),
      subcategoria_nivel2(nombre, subcategoria_nivel1(nombre))
    `)
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return productos.map(producto => ({
    id_sku: producto.id_sku,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    imagen_url: producto.imagen_principal,
    disponible: producto.activo,
    especificaciones: producto.especificaciones || {},
    marca: producto.marcas?.nombre || 'Sin marca',
    subcategoria: producto.subcategoria_nivel2?.nombre || '',
    categoria: producto.subcategoria_nivel2?.subcategoria_nivel1?.nombre || ''
  }));
}