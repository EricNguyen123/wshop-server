import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfigModule } from './config/databases/module-db/db.module';
import { DatabaseModule } from './config/databases/database.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [DatabaseConfigModule, DatabaseModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
