// modules/game/game.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { GameController } from './controllers/game.controller';
import { GameService } from './services/game.service';
import { Game, GameSchema } from './schemas/game.schema';
import { GamePlay, GamePlaySchema } from './schemas/game-play.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameSchema },
      { name: GamePlay.name, schema: GamePlaySchema },
    ]),
    ConfigModule,
  ],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}