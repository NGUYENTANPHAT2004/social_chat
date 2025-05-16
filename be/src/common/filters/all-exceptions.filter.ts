// common/filters/all-exceptions.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  import { ConfigService } from '@nestjs/config';
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);
  
    constructor(private configService: ConfigService) {}
  
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      
      // Xác định HTTP status
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      
      // Xác định message
      let message = 'Internal server error';
      let error = 'Internal Server Error';
      let details = null;
      
      if (exception instanceof HttpException) {
        const exceptionResponse = exception.getResponse();
        
        if (typeof exceptionResponse === 'object') {
          message = (exceptionResponse as any).message || exception.message;
          error = (exceptionResponse as any).error || 'Error';
          details = (exceptionResponse as any).details || null;
        } else {
          message = exceptionResponse as string;
        }
      } else {
        message = exception.message || 'Internal server error';
      }
      
      // Ghi log lỗi
      this.logError(request, exception, status);
      
      // Kiểm tra môi trường để quyết định chi tiết lỗi trả về
      const isProduction = this.configService.get('server.environment') === 'production';
      
      const responseBody = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        error,
        message,
        // Chỉ trả về stack trace khi không phải môi trường production
        ...(isProduction ? {} : {
          details: details || exception.details || null,
          stack: exception.stack || null,
        }),
      };
      
      // Trả về response lỗi
      response.status(status).json(responseBody);
    }
    
    private logError(request: Request, exception: any, status: number) {
      const requestInfo = {
        method: request.method,
        url: request.url,
        query: request.query,
        params: request.params,
        ip: request.ip,
        user: (request as any).user?.id || 'không xác định',
      };
      
      if (status >= 500) {
        this.logger.error(
          `[${requestInfo.method}] ${requestInfo.url} - ${status} | User: ${requestInfo.user}`,
          exception.stack,
          'AllExceptionsFilter'
        );
      } else if (status >= 400) {
        this.logger.warn(
          `[${requestInfo.method}] ${requestInfo.url} - ${status} | User: ${requestInfo.user} | ${exception.message}`,
          'AllExceptionsFilter'
        );
      }
      
      // Cấu hình để logger error vào hệ thống theo dõi lỗi như Sentry, hoặc file log
      if (status >= 500) {
        this.logToErrorTrackingSystem(requestInfo, exception);
      }
    }
    
    private logToErrorTrackingSystem(requestInfo: any, exception: any) {
      // Integrate with Sentry, Rollbar, or other error tracking systems
      // Example:
      // if (Sentry) {
      //   Sentry.withScope(scope => {
      //     scope.setExtras(requestInfo);
      //     Sentry.captureException(exception);
      //   });
      // }
      
      // Hoặc ghi vào database / file
      try {
        // this.errorLogService.create({
        //   method: requestInfo.method,
        //   url: requestInfo.url,
        //   userId: requestInfo.user,
        //   errorMessage: exception.message,
        //   errorStack: exception.stack,
        //   timestamp: new Date(),
        // });
      } catch (err) {
        this.logger.error('Error saving to error log', err.stack);
      }
    }
  }