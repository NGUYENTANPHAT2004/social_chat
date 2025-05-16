// modules/room/controllers/room.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ForbiddenException,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RoomService } from '../services/room.service';
  import { CreateRoomDto } from '../dto/create-room.dto';
  import { UpdateRoomDto } from '../dto/update-room.dto';
  import { RoomAccessGuard } from '../guards/room-access.guard';
  import { RoomType, RoomStatus } from '../schemas/room.schema';
  
  @ApiTags('rooms')
  @Controller('rooms')
  export class RoomController {
    constructor(private readonly roomService: RoomService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo phòng mới' })
    @ApiResponse({ status: 201, description: 'Phòng đã được tạo thành công' })
    async createRoom(@Body() createRoomDto: CreateRoomDto, @Request() req) {
      return this.roomService.createRoom(createRoomDto, req.user.id);
    }
  
    @Get()
    @ApiOperation({ summary: 'Lấy danh sách phòng' })
    @ApiResponse({ status: 200, description: 'Danh sách phòng' })
    async getRooms(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('type') type?: RoomType,
      @Query('status') status?: RoomStatus,
      @Query('tag') tag?: string,
      @Query('isLive') isLive?: boolean,
    ) {
      const filter: any = {};
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (tag) filter.tags = tag;
      if (isLive !== undefined) filter.isLive = isLive;
      
      return this.roomService.getRooms(filter, { page, limit });
    }
  
    @Get('trending')
    @ApiOperation({ summary: 'Lấy danh sách phòng thịnh hành' })
    @ApiResponse({ status: 200, description: 'Danh sách phòng thịnh hành' })
    async getTrendingRooms(
      @Query('limit') limit: number = 10,
    ) {
      return this.roomService.getTrendingRooms(limit);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin phòng theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin phòng' })
    async getRoomById(@Param('id') id: string) {
      return this.roomService.getRoomById(id);
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoomAccessGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật thông tin phòng' })
    @ApiResponse({ status: 200, description: 'Phòng đã được cập nhật' })
    async updateRoom(
      @Param('id') id: string,
      @Body() updateRoomDto: UpdateRoomDto,
      @Request() req,
    ) {
      // RoomAccessGuard đã kiểm tra quyền truy cập
      return this.roomService.updateRoom(id, updateRoomDto);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa phòng' })
    @ApiResponse({ status: 200, description: 'Phòng đã được xóa' })
    async deleteRoom(@Param('id') id: string, @Request() req) {
      const room = await this.roomService.getRoomById(id);
      
      if (room.owner.toString() !== req.user.id) {
        throw new ForbiddenException('Bạn không có quyền xóa phòng này');
      }
      
      return this.roomService.deleteRoom(id);
    }
  
    @Post(':id/join')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tham gia phòng' })
    @ApiResponse({ status: 200, description: 'Đã tham gia phòng thành công' })
    async joinRoom(
      @Param('id') id: string,
      @Body('password') password: string,
      @Request() req,
    ) {
      return this.roomService.joinRoom(id, req.user.id, password);
    }
  
    @Post(':id/leave')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Rời phòng' })
    @ApiResponse({ status: 200, description: 'Đã rời phòng thành công' })
    async leaveRoom(@Param('id') id: string, @Request() req) {
      return this.roomService.leaveRoom(id, req.user.id);
    }
  
    @Post(':id/follow')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Theo dõi phòng' })
    @ApiResponse({ status: 200, description: 'Đã theo dõi phòng thành công' })
    async followRoom(@Param('id') id: string, @Request() req) {
      return this.roomService.followRoom(id, req.user.id);
    }
  
    @Post(':id/unfollow')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Hủy theo dõi phòng' })
    @ApiResponse({ status: 200, description: 'Đã hủy theo dõi phòng thành công' })
    async unfollowRoom(@Param('id') id: string, @Request() req) {
      return this.roomService.unfollowRoom(id, req.user.id);
    }
  
    @Get(':id/members')
    @ApiOperation({ summary: 'Lấy danh sách thành viên của phòng' })
    @ApiResponse({ status: 200, description: 'Danh sách thành viên' })
    async getRoomMembers(
      @Param('id') id: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.roomService.getRoomMembers(id, { page, limit });
    }
  
    @Post(':id/start-stream')
    @UseGuards(JwtAuthGuard, RoomAccessGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Bắt đầu stream trong phòng' })
    @ApiResponse({ status: 200, description: 'Stream đã được bắt đầu' })
    async startStream(@Param('id') id: string, @Request() req) {
      return this.roomService.startStream(id);
    }
  
    @Post(':id/end-stream')
    @UseGuards(JwtAuthGuard, RoomAccessGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Kết thúc stream trong phòng' })
    @ApiResponse({ status: 200, description: 'Stream đã được kết thúc' })
    async endStream(@Param('id') id: string, @Request() req) {
      return this.roomService.endStream(id);
    }
  }