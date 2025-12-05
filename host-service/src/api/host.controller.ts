import { Body, Controller, Post, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { RegisterHostUseCase, RegisterHostDto } from '@going-monorepo-clean/domains-anfitriones-application';
import { Host } from '@going-monorepo-clean/domains-anfitriones-core';

@Controller('hosts') 
export class HostController {
  
  constructor(
    private readonly registerHostUseCase: RegisterHostUseCase,
    // [Opcional] private readonly verifyHostUseCase: VerifyHostUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED) 
  async registerHost(@Body() registerDto: RegisterHostDto): Promise<Host> {
    
    const result = await this.registerHostUseCase.execute(registerDto);

    if (result.isErr()) {
      throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST); 
    }
    
    return result.value; 
  }
}