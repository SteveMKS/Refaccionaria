import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

// Datos de ejemplo para varios productos
const productosEjemplo = [
  {
    id: "15D933",
    nombre: "Aceite de Motor Sintético Castrol 5W-40",
    precio: 449.00,
    imagen_url: "/Castrol.jpg",
    marca: "Castrol",
    numero_parte: "15D933",
    sku: "539624",
    descripcion: "Aceite sintético de alto rendimiento para motores modernos",
    disponible: true,
  },
  {
    id: "16A234",
    nombre: "Aceite de Motor Full Sintético Mobil 1",
    precio: 499.00,
    imagen_url: "/Mobil.jpg",
    marca: "Mobil",
    numero_parte: "16A234",
    sku: "02122002",
    descripcion: "Aceite sintético de alto rendimiento para motores modernos",
    disponible: true,
  },
  // Agrega más productos según necesites
];

export default function ProductosPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Nuestros Productos</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productosEjemplo.map((producto) => (
          <Link key={producto.id} href={`/productos/${producto.id}`}>
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{producto.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="aspect-square relative bg-gray-100 rounded-md">
                  <Image
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <p className="font-bold text-lg">
                  ${producto.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600">{producto.marca}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}