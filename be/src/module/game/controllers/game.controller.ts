// modules/game/controllers/game.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../../auth/guards/roles.guard';
  import { Roles } from '../../auth/decorators/roles.decorator';
  import { UserRole } from '../../user/schemas/user.schema';
  import { GameService } from '../services/game.service';
  import { PlayGameDto } from '../dto/play-game.dto';
  import { GameType, GameStatus } from '../schemas/game.schema';
  
  @ApiTags('games')
  @Controller('games')
  export class GameController {
    constructor(private readonly gameService: GameService) {}
  
    @Get()
    @ApiOperation({ summary: 'Lấy danh sách game' })
    @ApiResponse({ status: 200, description: 'Danh sách game' })
    async getGames(
      @Query('type') type?: GameType,
      @Query('status') status?: GameStatus,
    ) {
      const filter: any = {};
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      
      return this.gameService.getGames(filter);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin game theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin game' })
    async getGameById(@Param('id') id: string) {
      return this.gameService.getGameById(id);
    }
  
    @Post('play')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Chơi game' })
    @ApiResponse({ status: 200, description: 'Kết quả chơi game' })
    async playGame(@Body() playGameDto: PlayGameDto, @Request() req) {
      return this.gameService.playGame(playGameDto, req.user.id);
    }
  
    @Get('daily-spin/status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Kiểm tra trạng thái Daily Spin' })
    @ApiResponse({ status: 200, description: 'Trạng thái Daily Spin' })
    async getDailySpinStatus(@Request() req) {
      return this.gameService.getDailySpinStatus(req.user.id);
    }
  
    @Post('daily-spin/play')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Quay Daily Spin' })
    @ApiResponse({ status: 200, description: 'Kết quả Daily Spin' })
    async playDailySpin(@Request() req) {
      return this.gameService.playDailySpin(req.user.id);
    }
  
    @Get('history/me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy lịch sử chơi game của bản thân' })
    @ApiResponse({ status: 200, description: 'Lịch sử chơi game' })
    async getMyGameHistory(
      @Request() req,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('gameType') gameType?: GameType,
    ) {
      return this.gameService.getUserGameHistory(req.user.id, { page, limit }, gameType);
    }
  
    @Get('leaderboard')
    @ApiOperation({ summary: 'Lấy bảng xếp hạng người chơi' })
    @ApiResponse({ status: 200, description: 'Bảng xếp hạng' })
    async getLeaderboard(
      @Query('limit') limit: number = 10,
      @Query('period') period: 'day' | 'week' | 'month' | 'all' = 'all',
    ) {
      return this.gameService.getLeaderboard(limit, period);
    }
  
    @Get('statistics')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thống kê game (chỉ Admin)' })
    @ApiResponse({ status: 200, description: 'Thống kê game' })
    async getGameStatistics() {
      return this.gameService.getGameStatistics();
    }
  }