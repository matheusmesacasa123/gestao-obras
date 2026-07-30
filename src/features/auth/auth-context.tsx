import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/integrations/supabase/client";


type AuthContextType = {
  user: any;
  loading: boolean;
};


const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});


export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    supabase.auth.getSession()
      .then(({ data }) => {
        setUser(data.session?.user ?? null);
        setLoading(false);
      });


    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );


    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}