import ScannerRedirect from "@/components/Scanner/ScannerRedirect"; // ajusta la ruta según dónde lo tengas

export default function RecibosPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Escanear recibo</h1>
      <ScannerRedirect />
    </main>
  );
}
