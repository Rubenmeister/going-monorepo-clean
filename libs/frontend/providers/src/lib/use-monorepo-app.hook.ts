import { useAuth } from './auth-context.provider';

export const useMonorepoApp = () => {
  // Ahora useAuth sí existe porque lo exportamos en el archivo anterior
  const authState = useAuth();
  
  return {
    // Exponemos el estado de autenticación
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    login: authState.login,
    logout: authState.logout,

    // Exponemos las funciones "Dummy" para que la UI no se rompa
    payment: authState.dependencies.payment,
    parcel: authState.dependencies.parcel,
    trips: authState.dependencies.trips
  };
};
