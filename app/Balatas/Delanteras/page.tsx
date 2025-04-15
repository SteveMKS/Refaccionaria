"use client";
import { useTestStore } from '@/hooks/useTestStore';

export default function TestPage() {
  const { count, increment } = useTestStore();
  return (
    <div className="p-4">
      <p>Contador: {count}</p>
      <button 
        onClick={increment}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        +1
      </button>
    </div>
  );
}