"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export default function AgregarProducto() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    numero_parte: "",
    id_sku: "",
    nombre: "",
    descripcion: "",
    precio: "",
    existencias: "",
    imagen_url: "",
    id_marca: "",
    id_subcategoria3: "",
  });

  const [categories, setCategories] = useState({
    main: [],
    sub1: [],
    sub2: [],
    sub3: [],
    marcas: [],
  });

  // Función para cargar categorías y marcas desde Supabase
  const fetchCategoriesAndBrands = async () => {
    try {
      // Cargar categorías principales
      const { data: mainCategories, error: mainError } = await supabase
        .from("categorias")
        .select("*")
        .eq("nivel", 1);

      // Cargar marcas
      const { data: brands, error: brandError } = await supabase
        .from("marcas")
        .select("*");

      if (mainError) throw mainError;
      if (brandError) throw brandError;

      setCategories(prev => ({
        ...prev,
        main: mainCategories || [],
        marcas: brands || [],
      }));
    } catch (error) {
      toast({
        title: "Error al cargar datos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Cargar subcategorías dinámicamente al seleccionar una categoría superior
  const fetchSubcategories = async (level: number, parentId: string) => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .eq("nivel", level)
        .eq("id_categoria_padre", parentId);

      if (error) throw error;

      setCategories(prev => ({
        ...prev,
        [`sub${level - 1}`]: data || [],
      }));
    } catch (error) {
      toast({
        title: "Error al cargar subcategorías",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Cargar categorías y marcas al montar el componente
  useEffect(() => {
    fetchCategoriesAndBrands();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = async (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "id_categoria_main") {
      await fetchSubcategories(2, value); // Cargar subcategoría nivel 1
    } else if (name === "id_subcategoria1") {
      await fetchSubcategories(3, value); // Cargar subcategoría nivel 2
    } else if (name === "id_subcategoria2") {
      await fetchSubcategories(4, value); // Cargar subcategoría nivel 3
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("productos")
        .insert([{
          numero_parte: formData.numero_parte,
          id_sku: formData.id_sku,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          precio: parseFloat(formData.precio),
          existencias: parseInt(formData.existencias),
          imagen_url: formData.imagen_url,
          id_marca: parseInt(formData.id_marca),
          id_subcategoria3: parseInt(formData.id_subcategoria3),
        }]);

      if (error) throw error;

      toast({
        title: "Producto agregado",
        description: "El producto se ha registrado correctamente",
      });

      setFormData({
        numero_parte: "",
        id_sku: "",
        nombre: "",
        descripcion: "",
        precio: "",
        existencias: "",
        imagen_url: "",
        id_marca: "",
        id_subcategoria3: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Agregar Nuevo Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="numero_parte">Número de Parte</Label>
                <Input
                  id="numero_parte"
                  name="numero_parte"
                  value={formData.numero_parte}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="id_sku">SKU</Label>
                <Input
                  id="id_sku"
                  name="id_sku"
                  value={formData.id_sku}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="nombre">Nombre del Producto</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="precio">Precio</Label>
                <Input
                  id="precio"
                  name="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="existencias">Existencias</Label>
                <Input
                  id="existencias"
                  name="existencias"
                  type="number"
                  min="0"
                  value={formData.existencias}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="imagen_url">URL de la Imagen</Label>
              <Input
                id="imagen_url"
                name="imagen_url"
                type="url"
                value={formData.imagen_url}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Categoría Principal</Label>
                <Select onValueChange={(value) => handleSelectChange("id_categoria_main", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Esto sería dinámico desde la base de datos */}
                    <SelectItem value="1">Motor</SelectItem>
                    <SelectItem value="2">Transmisión</SelectItem>
                    <SelectItem value="3">Frenos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Marca</Label>
                <Select onValueChange={(value) => handleSelectChange("id_marca", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Esto sería dinámico desde la base de datos */}
                    <SelectItem value="1">Bosch</SelectItem>
                    <SelectItem value="2">ACDelco</SelectItem>
                    <SelectItem value="3">Mobil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selectores de subcategorías (se mostrarían dinámicamente según selección previa) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Subcategoría Nivel 1</Label>
                <Select onValueChange={(value) => handleSelectChange("id_subcategoria1", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Dinámico */}
                    <SelectItem value="1">Filtros</SelectItem>
                    <SelectItem value="2">Bujías</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategoría Nivel 2</Label>
                <Select onValueChange={(value) => handleSelectChange("id_subcategoria2", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Dinámico */}
                    <SelectItem value="1">Filtros de Aire</SelectItem>
                    <SelectItem value="2">Filtros de Aceite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategoría Nivel 3</Label>
                <Select onValueChange={(value) => handleSelectChange("id_subcategoria3", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Dinámico */}
                    <SelectItem value="1">Filtros de Aire Premium</SelectItem>
                    <SelectItem value="2">Filtros de Aire Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Agregar Producto"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}