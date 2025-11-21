import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

// --- DTOs del Backend ---
export interface LoginCredentialsDto {
    email: string;
    password: string;
}

export interface UserAuthDto {
    token: string;
    user: {
        id: UUID;
        email: string;
        firstName: string;
        roles: string[];
    };
}

/**
 * Cliente HTTP puro para el dominio User.
 */
export class UserApiClient {
    private readonly baseUrl = 'http://localhost:3000/api/auth';
    
    public async login(credentials: LoginCredentialsDto): Promise<Result<UserAuthDto, Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            
            const data: UserAuthDto = await response.json();
            
            if (!response.ok) {
                return err(new Error(data.message || 'Credenciales inválidas.'));
            }
            
            return ok(data);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }
}