import { supabase } from '@/lib/supabase';

export async function getProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select(`
      id_sku,
      nombre,
      descripcion,
      precio,
      imagen_principal,
      existencias,
      activo,
      marcas(nombre),
      subcategoria_nivel2(nombre, subcategoria_nivel1(nombre))
    `)
    .eq('activo', true) // Solo productos activos
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data.map(producto => ({
    id: producto.id_sku,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    imagen_url: producto.imagen_principal,
    marca: producto.marcas?.nombre || 'Sin marca',
    existencias: producto.existencias,
    disponible: producto.activo && producto.existencias > 0,
    categoria: producto.subcategoria_nivel2?.subcategoria_nivel1?.nombre || '',
    subcategoria: producto.subcategoria_nivel2?.nombre || ''
  }));
}