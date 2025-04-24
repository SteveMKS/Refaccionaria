import { GetServerSideProps } from 'next';
import { supabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/router';

interface Categoria {
  id: string;
  nombre: string;
}

interface Props {
  categoriaMainNombre: string;
  categorias: Categoria[];
}

export default function CategoriaMainPage({ categoriaMainNombre, categorias }: Props) {
  const router = useRouter();

  if (!categorias || categorias.length === 0) {
    return <p className="p-4 text-red-500">No se encontraron subcategorías para esta categoría.</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Subcategorías de {categoriaMainNombre}</h1>
      <ul className="grid gap-4">
        {categorias.map((categoria) => (
          <li
            key={categoria.id}
            className="p-4 border rounded hover:bg-gray-100 transition cursor-pointer"
            onClick={() => router.push(`/Categorias/${categoriaMainNombre}/${categoria.nombre}`)}
          >
            {categoria.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ✅ getServerSideProps para obtener datos del backend antes de renderizar
export const getServerSideProps: GetServerSideProps = async (context) => {
  const categoriaMainNombre = context.params?.categoriaMainNombre as string;

  const { data: categoriaMain, error: mainError } = await supabase
    .from('categoria_main')
    .select('id')
    .ilike('nombre', categoriaMainNombre)
    .single();

  if (mainError || !categoriaMain) {
    return {
      notFound: true,
    };
  }

  const { data: categorias, error: categoriasError } = await supabase
    .from('categorias')
    .select('id, nombre')
    .eq('id_categoria_main', categoriaMain.id);

  return {
    props: {
      categoriaMainNombre,
      categorias: categorias || [],
    },
  };
};
