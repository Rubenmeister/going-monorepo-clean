import { Body, Controller, Post, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { 
  RegisterUserUseCase, 
  LoginUserUseCase,
  RegisterUserDto, 
  LoginUserDto, 
} from '@going-monorepo-clean/domains-user-application'; 

@Controller('auth')
export class AuthController {
  
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterUserDto) {
    const result = await this.registerUserUseCase.execute(registerDto);

    if (result.isErr()) {
      throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST);
    }
    
    return result.value;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginUserDto) {
    const result = await this.loginUserUseCase.execute(loginDto);
    
    if (result.isErr()) {
      throw new HttpException(result.error.message, HttpStatus.UNAUTHORIZED);
    }
    
    return result.value;
  }
}