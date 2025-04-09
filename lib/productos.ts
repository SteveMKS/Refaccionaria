/*import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react'

// Tipos para las relaciones
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

// Tipo para el producto completo que esperamos recibir
interface ProductoResponse {
  id_sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_principal: string;
  existencias: number;
  activo: boolean;
  marcas: Marca | null;
  subcategoria_nivel2: (SubcategoriaNivel2 & {
    subcategoria_nivel1: SubcategoriaNivel1 | null;
  }) | null;
}

// Tipo para el frontend
export interface ProductoFrontend {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  marca: string;
  existencias: number;
  disponible: boolean;
  categoria: string;
  subcategoria: string;
}

export async function getProductos(): Promise<ProductoFrontend[]> {
  const { data, error } = await supabase
    .from('productos')
    .select(`
      id_sku,
      nombre,
      descripcion,
      precio,
      existencias,
      imagen_principal,
      activo,
      marcas: id_marca (nombre),
      subcategoria_nivel2: id_subcategoria2 (
        nombre, 
        subcategoria_nivel1: id_subcategoria1 (nombre)
    `)
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al buscar los productos:', error);
    return [];
  }

  // Función de ayuda para el mapeo seguro
  const mapProducto = (producto: ProductoResponse): ProductoFrontend => ({
    id: producto.id_sku,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    imagen_url: producto.imagen_principal || '/placeholder-product.jpg',
    marca: producto.marcas?.nombre || 'Sin marca',
    existencias: producto.existencias,
    disponible: producto.activo && producto.existencias > 0,
    categoria: producto.subcategoria_nivel2?.subcategoria_nivel1?.nombre || '',
    subcategoria: producto.subcategoria_nivel2?.nombre || ''
  });

  return data.map(mapProducto);
}*/