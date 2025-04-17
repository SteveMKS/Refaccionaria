'use client';

import { createContext } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import type { SupabaseClient } from '@supabase/supabase';

type Props = {
  children: React.ReactNode;
  client: SupabaseClient;
};

export function SupabaseProvider({ children, client }: Props) {
  return (
    <SessionContextProvider supabaseClient={client}>
      {children}
    </SessionContextProvider>
  );
}
