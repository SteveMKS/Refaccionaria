"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export default function ProductosPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('productos').select(`
        numero_parte,
        id_sku,
        nombre,
        descripcion,
        precio,
        existencias,
        imagen_url,
        marcas(nombre),
        subcategoria_nivel3:subcategoria_nivel3(nombre)
      `);

      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,numero_parte.ilike.%${searchTerm}%`);
      }

      if (filterCategory) {
        query = query.eq('id_subcategoria3', filterCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategoria_nivel3')
        .select('id_subcategoria3, nombre');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Inventario de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1">
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
            <div className="w-full md:w-64">
              <Select onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id_subcategoria3} value={category.id_subcategoria3}>
                      {category.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchProducts}>Buscar</Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <p>Cargando productos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p>No se encontraron productos</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Número de Parte</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Existencias</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.numero_parte}>
                      <TableCell>
                        <div className="w-16 h-16 relative">
                          <Image
                            src={product.imagen_url || "/placeholder-product.jpg"}
                            alt={product.nombre}
                            fill
                            className="object-cover rounded"
                            unoptimized
                          />
                        </div>
                      </TableCell>
                      <TableCell>{product.numero_parte}</TableCell>
                      <TableCell className="font-medium">{product.nombre}</TableCell>
                      <TableCell>{product.marcas?.nombre}</TableCell>
                      <TableCell>{product.subcategoria_nivel3?.nombre}</TableCell>
                      <TableCell>${product.precio.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={product.existencias > 0 ? "text-green-600" : "text-red-600"}>
                          {product.existencias}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          <Button variant="outline" size="sm">
                            Detalles
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}