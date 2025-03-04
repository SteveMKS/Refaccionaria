"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-6">
      <div className="max-w-2xl bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-4xl font-bold text-gray-800">¡Bienvenido a Refaccionaria XYZ!</h1>
        <p className="mt-4 text-gray-600">
          Encuentra las mejores refacciones y accesorios para tu vehículo con la mejor calidad y precio.
        </p>
        <div className="mt-6 flex gap-4">
          <Link href="/productos" passHref>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition">
              Explorar Productos
            </button>
          </Link>
          <Link href="/login" passHref>
            <button className="bg-gray-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-gray-700 transition">
              Iniciar Sesión
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
