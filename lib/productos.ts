// app/lib/productos.ts
import { supabase } from '@/lib/supabase';

interface Marca {
  nombre: string;
}

interface SubcategoriaNivel1 {
  nombre: string;
}

interface SubcategoriaNivel2 {
  nombre: string;
  subcategoria_nivel1: SubcategoriaNivel1;
}

interface ProductoDB {
  id_sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  existencia: number;
  imagen_principal: string;
  activo: boolean;
  marcas: Marca;
  subcategoria_nivel2: SubcategoriaNivel2;
}

interface ProductoFrontend {
  id_sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  existencia: number;
  imagen_principal: string;
  activo: boolean;
  marca: string;
  subcategoria: string;
  categoria: string;
}

export async function getProductos(): Promise<ProductoFrontend[]> {
  const { data: productos, error } = await supabase
    .from('productos')
    .select(`
      id_sku,
      nombre,
      descripcion,
      precio,
      imagen_principal,
      existencia,
      activo,
      marcas:id_marca(nombre),
      subcategoria_nivel2:id_subcategoria2(nombre, subcategoria_nivel1:subcategoria_nivel1(nombre))
    `)
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return (productos as unknown as ProductoDB[]).map(producto => ({
    id_sku: producto.id_sku,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    imagen_principal: producto.imagen_principal,
    activo: producto.activo,
    marca: producto.marcas?.nombre || 'Sin marca',
    subcategoria: producto.subcategoria_nivel2?.nombre || '',
    categoria: producto.subcategoria_nivel2?.subcategoria_nivel1?.nombre || ''
  }));
}