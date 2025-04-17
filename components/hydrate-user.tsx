'use client';

import { useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { createClient } from '@/lib/supabase-browser';

export function HydrateUser() {
  const setUser = useCart((state) => state.setUser);
  const supabase = createClient();

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
