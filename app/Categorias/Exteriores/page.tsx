import { LiveSearchBar } from "@/components/SearchBar"; 
export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Barra de búsqueda centrada */}
      <div className="flex justify-center mb-6">
        <LiveSearchBar />
      </div>
    </div>
  );
}
