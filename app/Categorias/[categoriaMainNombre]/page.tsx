import { supabase } from '@/lib/supabase-browser';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    categoriaMainNombre: string;
  };
}

export default async function CategoriaMainPage({ params }: PageProps) {
  const { categoriaMainNombre } = params;

  // Buscar la categoría principal
  const { data: categoriaMain, error: mainError } = await supabase
    .from('categoria_main')
    .select('id')
    .ilike('nombre', categoriaMainNombre)
    .single();

  if (mainError || !categoriaMain) {
    notFound();
  }

  // Buscar las categorías (subniveles) que pertenecen a esta main
  const { data: categorias, error: categoriasError } = await supabase
    .from('categorias')
    .select('id, nombre')
    .eq('id_categoria_main', categoriaMain.id);

  if (categoriasError) {
    return <p className="text-red-500">Error cargando las subcategorías.</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Subcategorías de {categoriaMainNombre}</h1>
      <ul className="grid gap-4">
        {categorias.map((categoria) => (
          <li
            key={categoria.id}
            className="p-4 border rounded hover:bg-gray-100 transition"
          >
            {categoria.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}
