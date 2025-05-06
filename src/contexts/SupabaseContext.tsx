import React, { createContext, useContext } from 'react';
import { supabase } from '../supabase';

const SupabaseContext = createContext({ supabase });

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SupabaseContext.Provider value={{ supabase }}>
    {children}
  </SupabaseContext.Provider>
);

export const useSupabase = () => useContext(SupabaseContext);