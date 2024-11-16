import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { MongooseConfigModule } from './mongoose.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KbizService } from './kbiz/kbiz.service';
import { KBizController } from './kbiz/kbiz.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Ensure ConfigModule is imported
    MongooseConfigModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController, KBizController],
  providers: [AppService, KbizService],
})
export class AppModule {}