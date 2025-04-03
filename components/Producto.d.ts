export interface Producto {
    nombre: string;
    numero_parte: string;
    id_sku: string;
    descripcion: string | null;
    precio: number;
    existencias: number;
    imagen_url: string | null;
    marcas: {
      nombre: string;
    } | null;
    subcategoria_nivel3: {
      nombre: string;
    } | null;
  }
  
  export interface ProductoDetalleProps {
    producto: Producto;
  }