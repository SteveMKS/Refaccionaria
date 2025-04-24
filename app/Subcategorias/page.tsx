import { supabase } from '@/lib/supabase-browser';

export default async function CategoriaPage({ params }: { params: { categoriaMainNombre: string } }) {
  const { categoriaMainNombre } = params;

  // Obtener ID de la categoria_main por su nombre
  const { data: categoriaMain, error: errorMain } = await supabase
    .from('categoria_main')
    .select('id')
    .ilike('nombre', categoriaMainNombre)
    .single();

  if (errorMain || !categoriaMain) {
    return <div className="p-4 text-red-500">No se encontró la categoría principal.</div>;
  }

  // Obtener subcategorías relacionadas
  const { data: subcategorias, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('id_categoria_main', categoriaMain.id);

  if (error) {
    return <div className="p-4 text-red-500">Error cargando subcategorías.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Subcategorías de {categoriaMainNombre}</h1>
      <ul className="space-y-2">
        {subcategorias.map((sub) => (
          <li key={sub.id} className="p-2 border rounded">
            {sub.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}
