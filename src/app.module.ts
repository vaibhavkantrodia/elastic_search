import { Module } from '@nestjs/common';
import { AuthModule } from './api/auth/auth.module';
import { UserModule } from './api/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ElasticsearchModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        node: configService.get('ELASTIC_URL'),
        auth: {
          apiKey: configService.get('ELASTIC_API_KEY'),
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRoot('mongodb://localhost/elastic-demo'),
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
