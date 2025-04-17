'use client';

import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createBrowserClient(
  'https://tplkyyoiwcvncjeampep.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwbGt5eW9pd2N2bmNqZWFtcGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NTY2MDcsImV4cCI6MjA1NTUzMjYwN30.gEYXGQ7AOq-wpgL31ixFpxU6xlzzRJikjcDpuj8mL2c'
);
