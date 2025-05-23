'use client';

import { useEffect } from 'react';
import { useCart } from '@/components/cart/useCart';
import { supabase } from '@/lib/supabase-browser';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export function HydrateUser() {
  const setUser = useCart((state) => state.setUser);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  return null;
}
