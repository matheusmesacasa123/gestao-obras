import {
  Outlet,
  createRootRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  AuthProvider,
  useAuth,
} from "@/features/auth/auth-context";

import {
  useEffect,
} from "react";

import {
  AppLayout,
} from "@/components/layout/app-layout";


export const Route = createRootRoute({
  component: RootComponent,
});


function RootComponent() {

  return (

    <AuthProvider>

      <ProtectedLayout />

    </AuthProvider>

  );
}



function ProtectedLayout() {

  const {
    user,
    loading,
  } = useAuth();


  const navigate = useNavigate();



  useEffect(() => {

    if (!loading && !user) {

      navigate({
        to: "/login",
      });

    }

  }, [
    user,
    loading,
  ]);



  if (loading) {

    return (
      <div className="p-10">
        Carregando...
      </div>
    );

  }



  return user ? (
    <AppLayout />
  ) : (
    <Outlet />
  );

}