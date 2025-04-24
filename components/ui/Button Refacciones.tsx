"use client"
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { categories } from '/components/app-sidebar.tsx';

export default function MenuCategorias() {
  const router = useRouter();
  const pathname = usePathname();

  const handleRefaccionesClick = () => {
    const refaccionesPath = '/Categorias/Refacciones';
    if (pathname === refaccionesPath) {
      router.refresh();
    } else {
      router.push(refaccionesPath);
    }
  };

  return (
    <div>
      {categories.map((category) => (
        <div key={category.title}>
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-gray-500" />
            {category.title}
          </h3>
          <ul className="space-y-1">
            {category.items.map((item) => (
              <li key={item.title}>
                {item.title === 'Refacciones' ? (
                  <button
                    onClick={handleRefaccionesClick}
                    className="w-full text-left px-4 py-2 hover:bg-gray-200 rounded text-gray-800 font-medium transition"
                  >
                    {item.title}
                  </button>
                ) : (
                  <Link
                    href={item.url}
                    className="block px-4 py-2 hover:bg-gray-100 rounded text-gray-700"
                  >
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
