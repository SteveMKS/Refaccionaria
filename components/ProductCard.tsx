// components/product/ProductCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ProductCard({ product }: { product: any }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          <Link href={`/productos/${product.numero_parte}`} className="hover:text-blue-600">
            {product.nombre}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="aspect-square bg-gray-100 rounded-md mb-3">
          <img
            src={product.imagen_url || "/placeholder-product.jpg"}
            alt={product.nombre}
            className="w-full h-full object-contain"
          />
        </div>
        <p className="font-bold text-lg">${product.precio.toLocaleString()}</p>
        <p className="text-sm text-gray-600">{product.marcas?.nombre}</p>
        <Button className="w-full" asChild>
          <Link href={`/productos/${product.numero_parte}`}>
            Ver detalles
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}