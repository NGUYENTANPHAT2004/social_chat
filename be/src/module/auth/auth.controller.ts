import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  
  import { AuthService } from './services/auth.service';
  import { RegisterDto } from './dto/register.dto';
  import { LoginDto } from './dto/login.dto';
  import { RefreshTokenDto } from './dto/refresh-token.dto';
  import { JwtAuthGuard } from './guards/jwt-auth.guard';
  import { GoogleAuthGuard } from './guards/google-auth.guard';
  import { FacebookAuthGuard } from './guards/facebook-auth.guard';
  
  @ApiTags('auth')
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    async register(@Body() registerDto: RegisterDto) {
      return this.authService.register(registerDto);
    }
  
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'User successfully logged in' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
      return this.authService.login(loginDto);
    }
  
    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
      return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }
  
    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@Req() req) {
      return this.authService.getProfile(req.user);
    }
  
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Google OAuth login' })
    @ApiResponse({ status: 200, description: 'Redirects to Google OAuth' })
    async googleAuth() {
      // Google OAuth redirect happens here
    }
  
    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiResponse({ status: 200, description: 'User authenticated via Google' })
    async googleAuthCallback(@Req() req) {
      return this.authService.socialLogin(req.user);
    }
  
    @Get('facebook')
    @UseGuards(FacebookAuthGuard)
    @ApiOperation({ summary: 'Facebook OAuth login' })
    @ApiResponse({ status: 200, description: 'Redirects to Facebook OAuth' })
    async facebookAuth() {
      // Facebook OAuth redirect happens here
    }
  
    @Get('facebook/callback')
    @UseGuards(FacebookAuthGuard)
    @ApiOperation({ summary: 'Facebook OAuth callback' })
    @ApiResponse({ status: 200, description: 'User authenticated via Facebook' })
    async facebookAuthCallback(@Req() req) {
      return this.authService.socialLogin(req.user);
    }
  
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({ status: 200, description: 'User successfully logged out' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async logout(@Body() body: { refreshToken: string }, @Req() req) {
      return this.authService.logout(req.user.id, body.refreshToken);
    }
  }