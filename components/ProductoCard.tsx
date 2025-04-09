"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { ProductoFrontend } from "@/lib/productos";

interface Props {
  producto: ProductoFrontend;
}

export function ProductoCard({ producto }: Props) {
  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{producto.nombre}</CardTitle>
      </CardHeader>

      <CardContent className="flex-grow space-y-3">
        <div className="relative mx-auto w-40 h-40 bg-gray-100 rounded-md mb-3">
          <Image
            src={producto.imagen_url || '/placeholder-product.jpg'}
            alt={producto.nombre}
            fill
            className="object-contain p-3"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>

        <div className="space-y-2 text-sm">
          <InfoRow label="Marca" value={producto.marca} />
          <InfoRow label="Disponibilidad" value={`${producto.existencias} unidades`} />
          <InfoRow label="Categoría" value={producto.categoria && producto.subcategoria 
            ? `${producto.categoria} › ${producto.subcategoria}` 
            : 'Sin categoría'} />
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 mt-2">
          {producto.descripcion}
        </p>

        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <span className="text-lg font-bold text-blue-600">
            ${producto.precio.toLocaleString('es-MX')}
          </span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              producto.disponible 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {producto.disponible ? 'Disponible' : 'Agotado'}
            </span>
            <button 
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="Agregar al carrito"
              disabled={!producto.disponible}
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="font-medium text-gray-600">{label}:</span>
    <span>{value}</span>
  </div>
);
