import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {
    console.log('CONSTRUCTOR: AppService initialized');
  }
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
