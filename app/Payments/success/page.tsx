import Link from "next/link"; 
export default function SuccessPage() {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="bg-white shadow-xl p-8 rounded-2xl text-center max-w-md">
          <h1 className="text-3xl font-bold text-green-600 mb-4">¡Pago exitoso!</h1>
          <p className="text-gray-700 mb-6">Gracias por tu compra. Tu pedido ha sido procesado con éxito.</p>
          <Link
            href="/"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-semibold"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }
  