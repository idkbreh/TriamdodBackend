import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users.schema';
import { UsersService } from './users.service';
import { CsvModule } from 'src/csv/csv.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CsvModule
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}