import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // 1. REGISTRO
  async register(body: any) {
    const newUser = new this.userModel(body);
    return newUser.save();
  }

  // 2. VALIDACIÓN (LOGIN)
  async login(body: any) {
    // Buscamos al usuario por email
    const user = await this.userModel.findOne({ email: body.email });
    
    // Si no existe, error
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificamos contraseña (En producción usaríamos bcrypt aquí)
    if (user.password !== body.password) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    // Si todo bien, retornamos éxito
    return {
      message: 'Login exitoso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'CONDUCTOR' // Hardcodeado por ahora
      },
      access_token: 'token_falso_demo_123' // Aquí iría el JWT real
    };
  }

  async findAll() {
    return this.userModel.find().exec();
  }
}