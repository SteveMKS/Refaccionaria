// types/productos.d.ts

// Tipo para la categoría principal
export interface CategoriaMain {
  id_categoria_main: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen_url: string | null;
}

// Tipo para subcategoría nivel 1
export interface SubcategoriaNivel1 {
  id_subcategoria1: number;
  id_categoria_main: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen_url: string | null;
}

// Tipo para subcategoría nivel 2
export interface SubcategoriaNivel2 {
  id_subcategoria2: number;
  id_subcategoria1: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen_url: string | null;
}

// Tipo para marcas
export interface Marca {
  id_marca: number;
  nombre: string;
  slug: string;
  logo_url: string | null;
  descripcion: string | null;
}

// Tipo principal para productos
export interface Producto {
  id_sku: string;
  id_subcategoria2: number;
  id_marca: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  existencias: number;
  imagen_principal: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  activo: boolean;
  destacado: boolean;
  
  // Relaciones (pueden ser opcionales dependiendo de tu consulta)
  marcas?: Marca;
  subcategoria_nivel2?: SubcategoriaNivel2;
  subcategoria_nivel1?: SubcategoriaNivel1; // Si haces join hasta nivel 1
  categoria_main?: CategoriaMain; // Si haces join hasta categoría principal
}

// Tipo para las consultas de productos con relaciones
export interface ProductoConRelaciones extends Producto {
  marcas: Marca;
  subcategoria_nivel2: SubcategoriaNivel2;
}