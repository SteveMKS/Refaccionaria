"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase-browser';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Image from "next/image";
import { 
  ChevronLeft, 
  ShoppingCart, 
  Home, 
  Plus, 
  Search, 
  ChevronRight, 
  Tag,
  Box,
  ShoppingBag 
} from "lucide-react";
import { Cart } from "@/components/cart/Cart";
import { useCart } from "@/hooks/useCart";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

// Tipos
interface CategoriaMain {
  id_categoria_main: string;
  nombre: string;
}

interface Categoria {
  id_categoria: string;
  nombre: string;
}

interface Subcategoria {
  id_subcategoria: string;
  nombre: string;
}

interface Subsubcategoria {
  id_subsubcategoria: string;
  nombre: string;
}

interface Marca {
  id_marca: string;
  nombre: string;
}

interface Producto {
  id_sku: string;
  id_marca: Marca;
  nombre: string;
  imagen_principal: string;
  descripcion: string;
  precio: number;
  existencias: number;
}

// Imágenes para categorías (simula iconos para categorías)
const categoryIcons = [
  "/api/placeholder/64/64",
  "/api/placeholder/64/64",
  "/api/placeholder/64/64",
  "/api/placeholder/64/64",
  "/api/placeholder/64/64",
  "/api/placeholder/64/64",
  "/api/placeholder/64/64",
  "/api/placeholder/64/64",
];

export default function RefaccionesPage() {
  const [nivel, setNivel] = useState<number>(1);
  const [categoriaMain, setCategoriaMain] = useState<CategoriaMain[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState<string | null>(null);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [subsubcategoriaSeleccionada, setSubsubcategoriaSeleccionada] = useState<string | null>(null);
  const [subsubcategorias, setSubsubcategorias] = useState<Subsubcategoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{label: string, nivel: number}[]>([{label: 'Refacciones', nivel: 1}]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addToCart, cart } = useCart(); // Modificado para usar cart en lugar de cartCount
  const { theme } = useTheme();

  // Efecto para cargar las categorías principales
  useEffect(() => {
    const cargarCategoriaMain = async () => {
      setIsLoading(true);
      const { data } = await supabase.from("categoria_main").select("id_categoria_main, nombre").order("nombre");
      if (data) setCategoriaMain(data);
      setIsLoading(false);
    };
    cargarCategoriaMain();
  }, []);

  // Efecto para cargar las categorías cuando se selecciona una categoría principal
  useEffect(() => {
    if (categoriaSeleccionada) {
      const cargarCategorias = async () => {
        setIsLoading(true);
        const { data } = await supabase
          .from("categorias")
          .select("id_categoria, nombre")
          .eq("id_categoria_main", categoriaSeleccionada)
          .order("nombre");
        if (data) setCategorias(data);
        setIsLoading(false);
      };
      cargarCategorias();
    }
  }, [categoriaSeleccionada]);

  // Efecto para cargar las subcategorías cuando se selecciona una categoría
  useEffect(() => {
    if (subcategoriaSeleccionada) {
      const cargarSubcategorias = async () => {
        setIsLoading(true);
        const { data } = await supabase
          .from("subcategorias")
          .select("id_subcategoria, nombre")
          .eq("id_categoria", subcategoriaSeleccionada)
          .order("nombre");
        if (data) setSubcategorias(data);
        setIsLoading(false);
      };
      cargarSubcategorias();
    }
  }, [subcategoriaSeleccionada]);

  // Efecto para cargar las subsubcategorías cuando se selecciona una subcategoría
  useEffect(() => {
    if (subsubcategoriaSeleccionada) {
      const cargarSubsubcategorias = async () => {
        setIsLoading(true);
        const { data } = await supabase
          .from("subsubcategorias")
          .select("id_subsubcategoria, nombre")
          .eq("id_subcategoria", subsubcategoriaSeleccionada)
          .order("nombre");
        if (data) setSubsubcategorias(data);
        setIsLoading(false);
      };
      cargarSubsubcategorias();
    }
  }, [subsubcategoriaSeleccionada]);

  // Efecto para cargar los productos cuando se selecciona una subsubcategoría
  useEffect(() => {
    const cargarProductos = async () => {
      if (nivel === 5 && subsubcategoriaSeleccionada) {
        setIsLoading(true);
        const { data } = await supabase
          .from("productos")
          .select("*, id_marca(id_marca, nombre)")
          .eq("id_subsubcategoria", subsubcategoriaSeleccionada)
          .order("nombre");
        if (data) setProductos(data);
        setIsLoading(false);
      }
    };
    cargarProductos();
  }, [nivel, subsubcategoriaSeleccionada]);

  // Función para actualizar las migas de pan
  const updateBreadcrumbs = (label: string, newNivel: number) => {
    setBreadcrumbs(prev => {
      const filtered = prev.filter(item => item.nivel < newNivel);
      return [...filtered, {label, nivel: newNivel}];
    });
  };

  // Función para navegar a través de las migas de pan
  const navigateToBreadcrumb = (nivel: number) => {
    setNivel(nivel);
    // Resetear selecciones según corresponda
    if (nivel < 5) setSubsubcategoriaSeleccionada(null);
    if (nivel < 4) setSubcategoriaSeleccionada(null);
    if (nivel < 3) setCategoriaSeleccionada(null);
  };

  // Función para seleccionar categoría principal
  const handleSelectCategoriaMain = (id: string, nombre: string) => {
    setCategoriaSeleccionada(id);
    updateBreadcrumbs(nombre, 2);
    setNivel(2);
  };

  // Función para seleccionar categoría
  const handleSelectCategoria = (id: string, nombre: string) => {
    setSubcategoriaSeleccionada(id);
    updateBreadcrumbs(nombre, 3);
    setNivel(3);
  };

  // Función para seleccionar subcategoría
  const handleSelectSubcategoria = (id: string, nombre: string) => {
    setSubsubcategoriaSeleccionada(id);
    updateBreadcrumbs(nombre, 4);
    setNivel(4);
  };

  // Función para seleccionar subsubcategoría
  const handleSelectSubsubcategoria = (id: string, nombre: string) => {
    setSubsubcategoriaSeleccionada(id);
    updateBreadcrumbs(nombre, 5);
    setNivel(5);
  };

  // Calcular la cantidad total de artículos en el carrito
  const cartCount = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Filtrar productos por término de búsqueda
  const filteredProductos = productos.filter(producto => 
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.id_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.id_marca.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Skeleton loader para productos
  const ProductSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="mx-auto w-40 h-40 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 rounded-full"></div>
        </div>
      </CardContent>
    </Card>
  );

  // Skeleton loader para categorías
  const CategorySkeleton = () => (
    <Card className="animate-pulse cursor-pointer hover:shadow-md">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Cabecera con búsqueda y carrito */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center space-x-2 w-full lg:w-auto">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              if (nivel > 1) {
                navigateToBreadcrumb(nivel - 1);
              }
            }}
            disabled={nivel === 1}
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar refacciones..." 
              className="pl-10 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={nivel !== 5}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <Cart />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Migas de pan */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={index}>
              {index === 0 ? (
                <BreadcrumbLink 
                  href="#" 
                  onClick={() => navigateToBreadcrumb(crumb.nivel)}
                  className="flex items-center"
                >
                  <Home className="h-4 w-4 mr-1" />
                  {crumb.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbLink 
                  href="#" 
                  onClick={() => navigateToBreadcrumb(crumb.nivel)}
                >
                  {crumb.label}
                </BreadcrumbLink>
              )}
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Título de la sección actual */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {breadcrumbs[breadcrumbs.length - 1]?.label || 'Refacciones'}
        </h1>
        {nivel === 5 && (
          <Badge variant="outline" className="text-sm font-medium">
            {filteredProductos.length} productos
          </Badge>
        )}
      </div>

      {/* Nivel 1: Categorías principales */}
      {nivel === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array(6).fill(0).map((_, index) => <CategorySkeleton key={index} />)
          ) : (
            categoriaMain.map((cat, index) => (
              <motion.div
                key={cat.id_categoria_main}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => handleSelectCategoriaMain(cat.id_categoria_main, cat.nombre)} 
                  className="cursor-pointer hover:shadow-md transition-all h-full group"
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <Image
                        src={categoryIcons[index % categoryIcons.length]}
                        alt={cat.nombre}
                        width={32}
                        height={32}
                        className="opacity-75 group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <h3 className="font-medium text-center text-sm">{cat.nombre}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Nivel 2: Categorías */}
      {nivel === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            categorias.map((cat, index) => (
              <motion.div
                key={cat.id_categoria}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => handleSelectCategoria(cat.id_categoria, cat.nombre)} 
                  className="cursor-pointer hover:shadow-md transition-all group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                          <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400 opacity-75" />
                        </div>
                        <h3 className="font-medium">{cat.nombre}</h3>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Nivel 3: Subcategorías */}
      {nivel === 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            subcategorias.map((sub, index) => (
              <motion.div
                key={sub.id_subcategoria}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => handleSelectSubcategoria(sub.id_subcategoria, sub.nombre)} 
                  className="cursor-pointer hover:shadow-md transition-all group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                          <Box className="h-6 w-6 text-blue-600 dark:text-blue-400 opacity-75" />
                        </div>
                        <h3 className="font-medium">{sub.nombre}</h3>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Nivel 4: Subsubcategorías */}
      {nivel === 4 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            subsubcategorias.map((subsub, index) => (
              <motion.div
                key={subsub.id_subsubcategoria}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  onClick={() => handleSelectSubsubcategoria(subsub.id_subsubcategoria, subsub.nombre)} 
                  className="cursor-pointer hover:shadow-md transition-all group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                          <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400 opacity-75" />
                        </div>
                        <h3 className="font-medium">{subsub.nombre}</h3>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Nivel 5: Productos */}
      {nivel === 5 && (
        <>
          {searchTerm && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredProductos.length} productos para "{searchTerm}"
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {isLoading ? (
              Array(6).fill(0).map((_, index) => <ProductSkeleton key={index} />)
            ) : filteredProductos.length > 0 ? (
              filteredProductos.map((producto, index) => (
                <motion.div
                  key={producto.id_sku}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all h-full flex flex-col group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-2 h-12">{producto.nombre}</CardTitle>
                      <CardDescription className="text-xs">
                        <Badge variant="outline" className="mr-2">
                          {producto.id_marca.nombre}
                        </Badge>
                        <span className="font-mono text-xs">SKU: {producto.id_sku}</span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-grow space-y-4">
                      <div className="relative mx-auto w-48 h-48 bg-gray-50 dark:bg-gray-800 rounded-md overflow-hidden group-hover:scale-105 transition-transform">
                        <Image
                          src={producto.imagen_principal}
                          alt={producto.nombre}
                          fill
                          className="object-contain p-3"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 h-10">{producto.descripcion}</p>

                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={producto.existencias > 0 ? "default" : "destructive"} 
                          className="text-xs"
                        >
                          {producto.existencias > 0 ? `${producto.existencias} en stock` : "Agotado"}
                        </Badge>
                      </div>
                    </CardContent>

                    <CardFooter className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">${producto.precio.toLocaleString("es-MX")}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        disabled={producto.existencias <= 0}
                        onClick={() => addToCart({
                          imagen_principal: producto.imagen_principal,
                          id: producto.id_sku,
                          name: producto.nombre,
                          descripcion: producto.descripcion,
                          price: producto.precio,
                        })}
                      >
                        <Plus className="h-4 w-4" />
                        Agregar
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" strokeWidth={1.5} />
                <h3 className="text-xl font-medium mb-2">No se encontraron productos</h3>
                <p className="text-sm text-muted-foreground">
                  Intenta con otra búsqueda o navega a través de las categorías
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}