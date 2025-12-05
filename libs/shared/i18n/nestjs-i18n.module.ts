import { Module } from '@nestjs/common';
import { I18nModule, I18nJsonLoader } from 'nestjs-i18n';
import * as path from 'path';
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
    }),
  ],
  exports: [I18nModule],
})
export class I18nConfigModule {}