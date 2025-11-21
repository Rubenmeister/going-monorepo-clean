import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { UserApiClient } from '@going-monorepo-clean/user-api-client'; // <--- NUEVA DEPENDENCIA
import { LoginDto } from '../dto/login.dto';

// --- View Model (Nuevo Modelo Simple para la UI) ---
export interface AuthViewModel {
    token: string;
    userId: string;
    firstName: string;
    roles: string[];
}

@Injectable()
export class LoginUseCase {
    private readonly apiClient: UserApiClient;

    constructor() {
        this.apiClient = new UserApiClient(); 
    }

    async execute(dto: LoginDto): Promise<Result<AuthViewModel, Error>> {
        // 1. Llamar al Adaptador (API Client)
        const result = await this.apiClient.login(dto);

        if (result.isErr()) {
            return err(result.error);
        }
        
        // 2. Mapear DTO a View Model (Transformación)
        const authDto = result.value;
        const viewModel: AuthViewModel = {
            token: authDto.token,
            userId: authDto.user.id,
            firstName: authDto.user.firstName,
            roles: authDto.user.roles,
        };

        return ok(viewModel);
    }
}