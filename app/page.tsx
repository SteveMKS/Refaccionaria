import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white p-6 sm:p-12">
      {/* Contenedor principal */}
      <main className="text-center space-y-6">
        {/* Título */}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-wide">
          ¡Bienvenido!
        </h1>
        {/* Descripción */}
        <p className="text-lg sm:text-xl text-gray-300 max-w-lg">
          Explora nuestra tienda y encuentra los mejores productos para tu vehículo.
        </p>
        {/* Botón de acción */}
        <Link
          href="/Categorias/Refacciones"
          className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 transition-colors text-white font-semibold py-3 px-6 rounded-lg text-lg shadow-lg"
        >
          Ver Refacciones
        </Link>
      </main>
    </div>
  );
}
