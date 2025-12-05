import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store'; // O AsyncStorage/Keychain equivalente

// Define las URLs base de TUS 10 microservicios
const SERVICE_URLS = {
    AUTH: 'http://<IP_API_GATEWAY>/api/auth', // O el microservicio directo
    BOOKING: 'http://<IP_API_GATEWAY>/api/bookings',
    PAYMENT: 'http://<IP_API_GATEWAY>/api/payments',
    // ... URLs para tours, transport, tracking, etc.
};

// La clave donde se guarda el token JWT
const TOKEN_KEY = 'user_jwt_token';

class ApiGateway {
    private api: AxiosInstance;

    constructor(baseURL: string) {
        // 1. Crear una instancia base de Axios para el servicio específico
        this.api = axios.create({ baseURL });
        
        // 2. Configurar el Interceptor para inyectar el token en cada solicitud
        this.api.interceptors.request.use(
            async (config) => {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // 3. (Opcional) Configurar Interceptor de Respuesta para manejar 401/Expiración
        this.api.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    // Aquí se implementa la lógica de renovación de token o cierre de sesión forzado
                    console.log('Token expirado o no autorizado. Redirigiendo a Login...');
                    // await SecureStore.deleteItemAsync(TOKEN_KEY);
                    // Redirigir al usuario
                }
                return Promise.reject(error);
            }
        );
    }

    public getInstance(): AxiosInstance {
        return this.api;
    }
}

// Exportamos una instancia de ApiGateway por cada microservicio clave
export const AuthApi = new ApiGateway(SERVICE_URLS.AUTH).getInstance();
export const BookingApi = new ApiGateway(SERVICE_URLS.BOOKING).getInstance();
// ...
export const PaymentApi = new ApiGateway(SERVICE_URLS.PAYMENT).getInstance();
// ... (Y los demás 7 servicios)