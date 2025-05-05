'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';

export function useRoleUser() {  // <- Cambiado a useRoleUser
  const [roleUser, setRoleUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoleUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('rol')
          .eq('id', user.id)
          .single();
        
        if (!error && data) setRoleUser(data.rol);
      }
      
      setLoading(false);
    };

    fetchRoleUser();
  }, []);

  return { roleUser, loading }; // <- Cambiado a minúscula para convención React
}