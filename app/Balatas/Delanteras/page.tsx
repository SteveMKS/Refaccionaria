"use client";
import { create } from 'zustand';

const useTestStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

export default function TestPage() {
  const { count, increment } = useTestStore();
  return (
    <div>
      <p>Contador: {count}</p>
      <button onClick={increment}>+1</button>
    </div>
  );
}