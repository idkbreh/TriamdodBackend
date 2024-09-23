import { Module } from '@nestjs/common';
import { MongooseConfigModule } from './mongoose.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({

  // Provide routes in here , include USer module /users 
  imports: [MongooseConfigModule, UsersModule, AuthModule],
  controllers: [AppController],
  providers: [AppService], 
})
export class AppModule {}