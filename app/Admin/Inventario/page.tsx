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
  DialogTrigger,
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
  DropdownMenuItem,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [formData, setFormData] = useState<Partial<Producto>>({ activo: true, destacado: false });
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("todos");
  const [isFiltering, setIsFiltering] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);

  const itemsPerPage = 10;

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
      const { error } = await supabase.from("productos").delete().eq("id_sku", id_sku);
      if (error) throw error;
      
      toast.success("Producto eliminado correctamente");
      fetchData();
    } catch (error) {
      toast.error("Error al eliminar producto");
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
      const { error } = await supabase.from("productos").update(formData).eq("id_sku", editingProduct.id_sku);
      
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

  return (
    <div className="mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Inventario</h1>
            <p className="text-muted-foreground">Administra tus productos, precios y existencias</p>
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => {
                setEditingProduct(null);
                setFormData({ activo: true, destacado: false });
                setOpenForm(true);
              }}
              className="group"
              size="sm">
                <PlusCircle className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Nuevo Producto
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Agregar nuevo producto al inventario</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle>Inventario de Productos</CardTitle>
            <CardDescription>
              {filteredProducts.length} productos encontrados
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre, SKU o número de parte..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtros
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <div className="p-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Marca</Label>
                          <Select 
                            value={selectedMarca || "all"} 
                            onValueChange={(value) => {
                              setSelectedMarca(value === "all" ? null : value);
                              setIsFiltering(true);
                            }}
                          >
                            <SelectTrigger>
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
                          <Label>Categoría</Label>
                          <Select 
                            value={selectedCategoria || "all"} 
                            onValueChange={(value) => {
                              setSelectedCategoria(value === "all" ? null : value);
                              setIsFiltering(true);
                            }}
                          >
                            <SelectTrigger>
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
                        
                        <div className="flex justify-between">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={resetFilters}
                          >
                            Limpiar
                          </Button>
                          <Button 
                            size="sm" 
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
                    className="text-muted-foreground"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="activos">Activos</TabsTrigger>
                <TabsTrigger value="inactivos">Inactivos</TabsTrigger>
                <TabsTrigger value="destacados">Destacados</TabsTrigger>
                <TabsTrigger value="agotados">Agotados</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-medium">SKU</TableHead>
                    <TableHead className="font-medium">Nombre</TableHead>
                    <TableHead className="font-medium">Marca</TableHead>
                    <TableHead className="font-medium">Precio</TableHead>
                    <TableHead className="font-medium text-center">Existencias</TableHead>
                    <TableHead className="font-medium text-center">Estado</TableHead>
                    <TableHead className="font-medium text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                          <p className="text-muted-foreground">Cargando productos...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((producto) => (
                      <TableRow key={producto.id_sku} className="transition-colors hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">{producto.id_sku}</TableCell>
                        <TableCell className="max-w-xs truncate font-medium">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-left">{producto.nombre}</TooltipTrigger>
                              <TooltipContent>
                                <p>{producto.nombre}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>{getMarcaNombre(producto.id_marca)}</TableCell>
                        <TableCell className="font-medium">${producto.precio.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={producto.existencias <= 0 ? "destructive" : producto.existencias < 10 ? "outline" : "secondary"}
                            className="font-mono"
                          >
                            {producto.existencias}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {producto.activo ? (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">Activo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Inactivo</Badge>
                          )}
                          {producto.destacado && (
                            <Badge variant="default" className="ml-1 bg-amber-500 hover:bg-amber-600">Destacado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEdit(producto)} 
                              className="h-8 px-2"
                            >
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDelete(producto.id_sku)} 
                              className="h-8 px-2"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No se encontraron productos con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }} 
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }} 
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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