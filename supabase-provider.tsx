'use client';

import { createContext } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import type { SupabaseClient } from '@supabase/supabase-js';

type Props = {
  children: React.ReactNode;
  supabase: SupabaseClient;
};

export const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children, supabase }: Props) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <SupabaseContext.Provider value={supabase}>
        {children}
      </SupabaseContext.Provider>
    </SessionContextProvider>
  );
}
