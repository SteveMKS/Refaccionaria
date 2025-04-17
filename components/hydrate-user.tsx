'use client';

import { useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/lib/supabase-browser';

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, supabase]);

  return null;
}
