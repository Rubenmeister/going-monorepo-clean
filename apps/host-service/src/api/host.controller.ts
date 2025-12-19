import { Body, Controller, Post, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { CreateHostUseCase, CreateHostDto } from '@going-monorepo-clean/domains-anfitriones-application';
import { Host } from '@going-monorepo-clean/domains-anfitriones-core';

@Controller('hosts') 
export class HostController {
  
  constructor(
    private readonly createHostUseCase: CreateHostUseCase,
    // [Opcional] private readonly verifyHostUseCase: VerifyHostUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED) 
  async register(@Body() dto: CreateHostDto): Promise<Host> {
    
    const result = await this.createHostUseCase.execute(dto);

    if (result.isErr()) {
      throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST); 
    }
    
    return result.value; 
  }
}