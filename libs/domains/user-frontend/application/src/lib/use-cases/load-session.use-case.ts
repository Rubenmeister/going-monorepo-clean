import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { AuthViewModel } from './login.use-case'; // Reutilizamos el View Model

@Injectable()
export class LoadSessionUseCase {
    private readonly AUTH_TOKEN_KEY = 'authToken';

    constructor() {
        // No necesita inyectar nada, solo lee el navegador.
    }

    public async execute(): Promise<Result<AuthViewModel | null, Error>> {
        try {
            if (typeof window === 'undefined') {
                return ok(null); // No hay LocalStorage en el servidor (Next.js SSR)
            }
            
            const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
            if (!token) {
                return ok(null);
            }
            
            // Decodificamos el token para obtener los datos del usuario
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            const viewModel: AuthViewModel = {
                token: token,
                userId: payload.sub,
                firstName: payload.firstName || 'Usuario', // Nombre simple de la carga
                roles: payload.roles,
            };

            return ok(viewModel);

        } catch (error) {
            // Si el token está corrupto o expirado, lo borramos
            localStorage.removeItem(this.AUTH_TOKEN_KEY);
            return err(new Error('Error al cargar la sesión: Token inválido.'));
        }
    }
}