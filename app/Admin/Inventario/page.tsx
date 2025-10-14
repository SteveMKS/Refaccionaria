"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Search, PlusCircle, Package, Loader2, Filter, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { number } from "framer-motion";
import { cn } from "@/lib/utils";

interface Producto {
  id_sku: string;
  num_parte: string;
  id_marca: string;
  nombre: string;
  descripcion: string;
  precio: number;
  existencias: number;
  imagen_principal: string;
  id_subsubcategoria: string;
  activo: boolean;
  destacado: boolean;
}

export default function InventarioAdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [marcas, setMarcas] = useState<{ id_marca: string; nombre: string }[]>([]);
  const [subcategorias, setSubcategorias] = useState<{ id_subsubcategoria: string; nombre: string }[]>([]);
  const [formData, setFormData] = useState<FormProducto>({ activo: true, destacado: false });
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("todos");
  const [isFiltering, setIsFiltering] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  type FormProducto = Partial<Producto> & { ajuste?: number };
  
  const INVENTARIO_BAJO_UMBRAL = 5; // Umbral para considerar inventario bajo
  const itemsPerPage = 10;

  // Función para determinar el estado del inventario
  const getInventoryStatus = (existencias: number) => {
    if (existencias <= 0) return 'agotado';
    if (existencias <= INVENTARIO_BAJO_UMBRAL) return 'bajo';
    return 'normal';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: productosData } = await supabase.from("productos").select("*").order("fecha_creacion", { ascending: false });
      const { data: marcasData } = await supabase.from("marcas").select("id_marca, nombre");
      const { data: subs } = await supabase.from("subsubcategorias").select("id_subsubcategoria, nombre");

      setProductos(productosData || []);
      setMarcas(marcasData || []);
      setSubcategorias(subs || []);
    } catch (error) {
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    if (!formData.id_sku || !formData.nombre || !formData.precio || !formData.id_marca) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("productos").insert([formData]);
      
      if (error) throw error;
      
      toast.success("Producto agregado correctamente");
      setFormData({ activo: true, destacado: false });
      setOpenForm(false);
      fetchData();
    } catch (error) {
      toast.error("Error al crear producto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id_sku: string) => {
    try {
      const { error } = await supabase
        .from("productos")
        .update({ activo: false })
        .eq("id_sku", id_sku);
    
      if (error) throw error;

      toast.success("Producto marcado como inactivo");
      fetchData();
      } catch (error) {
      toast.error("Error al desactivar el producto");
    }
  };

  const handleEdit = (producto: Producto) => {
    setFormData(producto);
    setEditingProduct(producto);
    setOpenForm(true);
  };

const handleUpdate = async () => {
  if (!editingProduct) return;
  setLoading(true);

  try {
    // Convertir valores numéricos
    const existenciasActuales = Number(editingProduct.existencias || 0);
    const ajuste = Number(formData.ajuste || 0);

    const nuevaExistencia = existenciasActuales + ajuste;

    if (nuevaExistencia < 0) {
      toast.error("No puedes tener existencias negativas");
      setLoading(false);
      return;
    }

    // Excluir 'ajuste' antes del update
    const { ajuste: _, ...formDataSinAjuste } = formData;

    const { error } = await supabase
      .from("productos")
      .update({
        ...formDataSinAjuste,
        existencias: nuevaExistencia,
      })
      .eq("id_sku", editingProduct.id_sku);

    if (error) throw error;

    toast.success("Producto actualizado correctamente");
    setEditingProduct(null);
    setFormData({ activo: true, destacado: false });
    setOpenForm(false);
    fetchData();
  } catch (error) {
    toast.error("Error al actualizar producto");
  } finally {
    setLoading(false);
  }
};


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setActiveTab("todos");
    setSelectedMarca(null);
    setSelectedCategoria(null);
    setIsFiltering(false);
  };

  // Filtering logic
  const filteredProducts = productos.filter(producto => {
    // Filtrado por término de búsqueda
    const matchesSearch = 
      searchTerm === "" || 
      producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.id_sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (producto.num_parte && producto.num_parte.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtrado por pestaña activa
    let matchesTab = false;
    switch(activeTab) {
      case "todos":
        matchesTab = true;
        break;
      case "activos":
        matchesTab = producto.activo === true;
        break;
      case "inactivos":
        matchesTab = producto.activo === false;
        break;
      case "destacados":
        matchesTab = producto.destacado === true;
        break;
      case "agotados":
        matchesTab = producto.existencias <= 0;
        break;
      default:
        matchesTab = true;
    }
    
    // Filtrado por marca y categoría
    const matchesMarca = !selectedMarca || producto.id_marca === selectedMarca;
    const matchesCategoria = !selectedCategoria || producto.id_subsubcategoria === selectedCategoria;
    
    return matchesSearch && matchesTab && matchesMarca && matchesCategoria;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const getMarcaNombre = (id_marca: string) => {
    const marca = marcas.find(m => m.id_marca === id_marca);
    return marca ? marca.nombre : "N/A";
  };

  const getCategoriaNombre = (id_subsubcategoria: string) => {
    const categoria = subcategorias.find(s => s.id_subsubcategoria === id_subsubcategoria);
    return categoria ? categoria.nombre : "N/A";
  };

  // Calcular resumen de inventario
  const inventorySummary = productos.reduce((acc, producto) => {
    const status = getInventoryStatus(producto.existencias);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Obtener productos con inventario bajo o agotado
  const lowStockProducts = productos
    .filter(p => p.existencias <= INVENTARIO_BAJO_UMBRAL)
    .sort((a, b) => a.existencias - b.existencias);

  return (
    <div className="mx-auto p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen">
      {/* Encabezado */}
      <div className="flex items-start pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">Gestión de Inventario</h1>
            <p className="text-sm text-gray-500">Administra tus productos, precios y existencias</p>
          </div>
        </div>
      </div>

      {/* Dashboard de Inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-gray-500">
              Productos Totales
            </CardTitle>
            <div className="text-xl font-semibold text-gray-900">{productos.length}</div>
          </CardHeader>
        </Card>
        
        <Card className={cn(
          "bg-white/50 backdrop-blur-sm border-0 shadow-sm",
          inventorySummary.bajo > 0 ? "border-l-4 border-l-yellow-500" : ""
        )}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-yellow-500" />
              Inventario Bajo
            </CardTitle>
            <div className="text-xl font-semibold text-yellow-600">
              {inventorySummary.bajo || 0}
            </div>
          </CardHeader>
        </Card>
        
        <Card className={cn(
          "bg-white/50 backdrop-blur-sm border-0 shadow-sm",
          inventorySummary.agotado > 0 ? "border-l-4 border-l-red-500" : ""
        )}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-red-500" />
              Productos Agotados
            </CardTitle>
            <div className="text-xl font-semibold text-red-600">
              {inventorySummary.agotado || 0}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Alerta de Productos con Bajo Stock */}
      {lowStockProducts.length > 0 && (
        <Card className="bg-white/50 backdrop-blur-sm border-yellow-100 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-yellow-500" />
              Productos con Inventario Crítico
            </CardTitle>
            <CardDescription>
              Los siguientes productos requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.slice(0, 6).map((producto) => (
                <div
                  key={producto.id_sku}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{producto.nombre}</p>
                    <p className="text-xs text-gray-500">SKU: {producto.id_sku}</p>
                  </div>
                  <Badge 
                    variant={producto.existencias === 0 ? "destructive" : "outline"} 
                    className={cn(
                      "shrink-0",
                      producto.existencias === 0 
                        ? "bg-red-100 text-red-600 border-red-200" 
                        : "bg-yellow-100 text-yellow-700 border-yellow-200"
                    )}
                  >
                    {producto.existencias} en stock
                  </Badge>
                </div>
              ))}
            </div>
            {lowStockProducts.length > 6 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Y {lowStockProducts.length - 6} productos más necesitan atención...
              </p>
            )}
          </CardContent>
        </Card>
      )}



      <div className="grid gap-8 md:grid-cols-1">
        <Card className="shadow-lg border-0 bg-white/90 rounded-xl">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-2xl font-bold text-gray-700">Inventario de Productos</CardTitle>
            <CardDescription className="text-gray-500">
              {filteredProducts.length} productos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre, SKU o número de parte..."
                  className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingProduct(null);
                          setFormData({ activo: true, destacado: false });
                          setOpenForm(true);
                        }}
                        className="group bg-gradient-to-r from-blue-500 to-blue-400 text-white hover:from-blue-600 hover:to-blue-500 transition-all duration-200"
                        size="sm"
                      >
                        <PlusCircle className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                        Nuevo Producto
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Agregar nuevo producto al inventario</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center rounded-lg border-gray-300 hover:bg-gray-100">
                      <Filter className="mr-2 h-4 w-4 text-blue-500" />
                      <span className="font-medium">Filtros</span>
                      <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-lg shadow-lg border-gray-200">
                    <div className="p-3">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-gray-700">Marca</Label>
                          <Select 
                            value={selectedMarca || "all"} 
                            onValueChange={(value) => {
                              setSelectedMarca(value === "all" ? null : value);
                              setIsFiltering(true);
                            }}
                          >
                            <SelectTrigger className="rounded-md border-gray-300">
                              <SelectValue placeholder="Todas las marcas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las marcas</SelectItem>
                              {marcas.map((marca) => (
                                <SelectItem key={marca.id_marca} value={marca.id_marca}>
                                  {marca.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700">Categoría</Label>
                          <Select 
                            value={selectedCategoria || "all"} 
                            onValueChange={(value) => {
                              setSelectedCategoria(value === "all" ? null : value);
                              setIsFiltering(true);
                            }}
                          >
                            <SelectTrigger className="rounded-md border-gray-300">
                              <SelectValue placeholder="Todas las categorías" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las categorías</SelectItem>
                              {subcategorias.map((cat) => (
                                <SelectItem key={cat.id_subsubcategoria} value={cat.id_subsubcategoria}>
                                  {cat.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-between gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-md border-gray-300"
                            onClick={resetFilters}
                          >
                            Limpiar
                          </Button>
                          <Button 
                            size="sm" 
                            className="rounded-md bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => setIsFiltering(true)}
                          >
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                {isFiltering && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="text-gray-400 hover:text-blue-500"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full md:w-auto bg-gray-100 rounded-lg p-1 flex gap-2">
                <TabsTrigger value="todos" className="rounded-md px-4 py-2 font-medium data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-colors">Todos</TabsTrigger>
                <TabsTrigger value="activos" className="rounded-md px-4 py-2 font-medium data-[state=active]:bg-green-500 data-[state=active]:text-white transition-colors">Activos</TabsTrigger>
                <TabsTrigger value="inactivos" className="rounded-md px-4 py-2 font-medium data-[state=active]:bg-gray-400 data-[state=active]:text-white transition-colors">Inactivos</TabsTrigger>
                <TabsTrigger value="destacados" className="rounded-md px-4 py-2 font-medium data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-colors">Destacados</TabsTrigger>
                <TabsTrigger value="agotados" className="rounded-md px-4 py-2 font-medium data-[state=active]:bg-red-500 data-[state=active]:text-white transition-colors">Agotados</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="rounded-xl border border-gray-200 overflow-x-auto bg-white shadow-sm">
              <Table className="min-w-full divide-y divide-gray-100">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">SKU</TableHead>
                    <TableHead className="font-semibold text-gray-700">Nombre</TableHead>
                    <TableHead className="font-semibold text-gray-700">Marca</TableHead>
                    <TableHead className="font-semibold text-gray-700">Precio</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Existencias</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Estado</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                          <p className="text-gray-400">Cargando productos...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((producto) => (
                      <TableRow key={producto.id_sku} className="transition-colors hover:bg-blue-50/60">
                        <TableCell className="font-mono text-xs text-gray-600">{producto.id_sku}</TableCell>
                        <TableCell className="max-w-xs truncate font-medium text-gray-700">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-left">{producto.nombre}</TooltipTrigger>
                              <TooltipContent>
                                <p>{producto.nombre}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-gray-600">{getMarcaNombre(producto.id_marca)}</TableCell>
                        <TableCell className="font-medium text-blue-600">${producto.precio.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <TooltipProvider>
                            <div className="flex items-center justify-center gap-2">
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge 
                                    variant={producto.existencias <= 0 ? "destructive" : producto.existencias <= INVENTARIO_BAJO_UMBRAL ? "outline" : "default"}
                                    className={cn(
                                      "font-mono",
                                      producto.existencias <= 0
                                        ? "bg-red-100 text-red-600 border-red-200"
                                        : producto.existencias <= INVENTARIO_BAJO_UMBRAL
                                        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                        : "bg-green-100 text-green-700 border-green-200",
                                      producto.existencias <= INVENTARIO_BAJO_UMBRAL && "animate-pulse"
                                    )}
                                  >
                                    {producto.existencias}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {producto.existencias === 0 ? (
                                    <p className="text-red-500 flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      Producto agotado - Requiere reabastecimiento
                                    </p>
                                  ) : producto.existencias <= INVENTARIO_BAJO_UMBRAL ? (
                                    <p className="text-yellow-500 flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      Inventario bajo - Reabastecer pronto
                                    </p>
                                  ) : (
                                    <p className="text-green-500 flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      Stock saludable
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                              {producto.existencias <= INVENTARIO_BAJO_UMBRAL && (
                                <Package 
                                  className={cn(
                                    "h-4 w-4",
                                    producto.existencias === 0 ? "text-red-500" : "text-yellow-500"
                                  )} 
                                />
                              )}
                            </div>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-center">
                          {producto.activo ? (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Activo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400 border-gray-300">Inactivo</Badge>
                          )}
                          {producto.destacado && (
                            <Badge variant="default" className="ml-1 bg-amber-500 hover:bg-amber-600 text-white">Destacado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEdit(producto)} 
                              className="h-8 px-2 rounded-md border-gray-300 hover:bg-blue-100 hover:border-blue-300 transition-all"
                            >
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDelete(producto.id_sku)} 
                              className="h-8 px-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all"
                            >
                              Desactivar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-gray-400">
                        No se encontraron productos con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-6 flex justify-center">
                <PaginationContent className="gap-2">
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }} 
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "bg-gray-100 rounded-md hover:bg-blue-100 transition-all"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    if (pageNumber > 0 && pageNumber <= totalPages) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNumber);
                            }}
                            isActive={currentPage === pageNumber}
                            className={
                              currentPage === pageNumber
                                ? "bg-blue-500 text-white rounded-md px-3 py-1 font-bold shadow"
                                : "bg-gray-100 text-gray-700 rounded-md px-3 py-1 font-medium hover:bg-blue-100 transition-all"
                            }
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis className="text-gray-400" />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }} 
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "bg-gray-100 rounded-md hover:bg-blue-100 transition-all"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Form Dialog ... sin cambios, ya mejorado antes */}
      <Dialog open={openForm} onOpenChange={(open) => {
        if (!open) {
          setEditingProduct(null);
          setFormData({ activo: true, destacado: false });
        }
        setOpenForm(open);
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifica los detalles del producto seleccionado" : "Completa el formulario para agregar un nuevo producto al inventario"}
            </DialogDescription>
          </DialogHeader>
          {/* Scrollable form container for responsive dialog */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2"
            style={{ scrollbarGutter: "stable" }}
          >
            {/* ...existing form fields... */}
            <div className="space-y-2">
              <Label htmlFor="id_sku">SKU*</Label>
              <Input
                id="id_sku"
                name="id_sku"
                value={formData.id_sku || ""}
                onChange={handleInputChange}
                disabled={!!editingProduct}
                placeholder="Ejemplo: SKU-12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num_parte">Número de Parte</Label>
              <Input
                id="num_parte"
                name="num_parte"
                value={formData.num_parte || ""}
                onChange={handleInputChange}
                placeholder="Ejemplo: NP-12345"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre">Nombre del Producto*</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre || ""}
                onChange={handleInputChange}
                placeholder="Ingrese el nombre del producto"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion || ""}
                onChange={handleInputChange}
                placeholder="Ingrese una descripción detallada del producto"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_marca">Marca*</Label>
              <Select
                value={formData.id_marca || ""}
                onValueChange={(value) => handleSelectChange("id_marca", value)}
              >
                <SelectTrigger id="id_marca">
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((marca) => (
                    <SelectItem key={marca.id_marca} value={marca.id_marca}>
                      {marca.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_subsubcategoria">Categoría</Label>
              <Select
                value={formData.id_subsubcategoria || ""}
                onValueChange={(value) => handleSelectChange("id_subsubcategoria", value)}
              >
                <SelectTrigger id="id_subsubcategoria">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {subcategorias.map((sub) => (
                    <SelectItem key={sub.id_subsubcategoria} value={sub.id_subsubcategoria}>
                      {sub.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio*</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="precio"
                  name="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.precio || ""}
                  onChange={handleInputChange}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="existencias">Existencias</Label>
              <Input
                id="existencias"
                name="existencias"
                type="number"
                min="0"
                value={formData.existencias || 0}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imagen_principal">URL de Imagen</Label>
              <Input
                id="imagen_principal"
                name="imagen_principal"
                value={formData.imagen_principal || ""}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ajuste">Ajuste de Existencias</Label>
              <Input
                type="number"
                id="ajuste"
                name="ajuste"
                placeholder="Ej: 5 o -2"
                value={formData.ajuste || ""}
                onChange={(e) => setFormData({ ...formData, ajuste: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between space-x-2 md:col-span-2">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="activo">Activo</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={formData.activo || false}
                    onCheckedChange={(checked) => handleSwitchChange("activo", checked)}
                  />
                  <Label htmlFor="activo" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.activo ? "Producto visible en la tienda" : "Producto oculto en la tienda"}
                  </Label>
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="destacado">Destacado</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="destacado"
                    checked={formData.destacado || false}
                    onCheckedChange={(checked) => handleSwitchChange("destacado", checked)}
                  />
                  <Label htmlFor="destacado" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.destacado ? "Aparecerá en secciones destacadas" : "No aparecerá en secciones destacadas"}
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenForm(false);
                setEditingProduct(null);
                setFormData({ activo: true, destacado: false });
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={editingProduct ? handleUpdate : handleCreate}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProduct ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}