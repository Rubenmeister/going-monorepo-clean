import { Inject, Injectable } from '@nestjs/common';
import { Result, err } from 'neverthrow';
import {
  Notification,
  INotificationRepository,
} from '@going-monorepo-clean/domains-notification-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class GetUserNotificationsUseCase {
  constructor(
    @Inject(INotificationRepository)
    private readonly repository: INotificationRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(userId: UUID): Promise<Result<Notification[], Error>> {
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado.'));
    }
    const token = sessionResult.value.token;

    return this.repository.getByUserId(userId, token);
  }
}