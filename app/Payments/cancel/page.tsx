import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-red-50 p-4">
      <section className="bg-white shadow-xl p-8 rounded-2xl text-center max-w-md w-full">
        <h1
          className="text-3xl font-bold text-red-600 mb-4"
          role="alert"
          aria-live="assertive"
        >
          ¡Pago cancelado!
        </h1>
        <p className="text-gray-700 mb-6">
          Tu transacción fue cancelada. Puedes intentar nuevamente cuando lo desees.
        </p>
        <Link
          href="/"
          className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold focus:outline-none focus:ring-4 focus:ring-red-300 transition"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
