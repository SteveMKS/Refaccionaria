import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart } from "lucide-react"; // Importamos el icono de carrito

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
    viscosidad: "5W-40",
    capacidad: "1 Cuarto"
  },
  {
    id: "16A234",
    nombre: "Aceite de Motor Full Sintético Mobil 1",
    precio: 499.00,
    imagen_url: "/Mobil.jpg",
    marca: "Mobil",
    numero_parte: "16A234",
    sku: "02122002",
    descripcion: "Protección superior del motor en todas las condiciones de manejo",
    disponible: true,
    viscosidad: "0W-20",
    capacidad: "1 Litro"
  },
];

export default function ProductosPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Catálogo de Productos</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productosEjemplo.map((producto) => (
          <Card key={producto.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{producto.nombre}</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-grow space-y-3">
              {/* Imagen del producto */}
              <div className="relative mx-auto w-40 h-40 bg-gray-100 rounded-md mb-3">
                <Image
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  fill
                  className="object-contain p-3"
                  priority
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              
              {/* Información del producto */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Marca:</span>
                  <span>{producto.marca}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">No. Parte:</span>
                  <span className="font-mono">{producto.numero_parte}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">SKU:</span>
                  <span className="font-mono">#{producto.sku}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Viscosidad:</span>
                  <span>{producto.viscosidad}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Capacidad:</span>
                  <span>{producto.capacidad}</span>
                </div>
              </div>
              
              {/* Descripción */}
              <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                {producto.descripcion}
              </p>
              
              {/* Precio y botón de carrito */}
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
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}