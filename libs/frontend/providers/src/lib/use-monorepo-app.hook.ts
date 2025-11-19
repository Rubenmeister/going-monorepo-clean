// ... (código existente) ...

export const useMonorepoApp = () => {
  const authState = useAuth();

  return {
    // 1. ESTADO GLOBAL
    auth: authState,

    // 2. CASOS DE USO (Funciones de Dominio)
    domain: {
      // ... (auth, bookings, transport, etc.) ...

      // Pagos (Payment Frontend)
      payment: {
        requestIntent: dependencyProvider.requestPaymentIntentUseCase.execute, // <-- NUEVO
      },
      
      // ... (demás dominios) ...
    },
  };
};