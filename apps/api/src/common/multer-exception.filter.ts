import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

interface MulterError extends Error {
  code: string;
}

function isMulterLimitError(err: unknown): err is MulterError {
  return (
    err instanceof Error &&
    !((err as unknown) instanceof HttpException) &&
    typeof (err as unknown as Record<string, unknown>)["code"] === "string" &&
    String((err as unknown as Record<string, unknown>)["code"]).startsWith("LIMIT_")
  );
}

@Catch()
export class MulterExceptionFilter implements ExceptionFilter {
  catch(err: unknown, host: ArgumentsHost) {
    if (!isMulterLimitError(err)) {
      // Re-delegate to NestJS default handling for HttpException and unknown errors
      if (err instanceof HttpException) {
        const res = host.switchToHttp().getResponse<Response>();
        res.status(err.getStatus()).json(err.getResponse());
        return;
      }
      const res = host.switchToHttp().getResponse<Response>();
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
      });
      return;
    }

    const res = host.switchToHttp().getResponse<Response>();
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: "File exceeds 2 MB limit",
        error: "Payload Too Large",
      });
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: err.message,
        error: "Bad Request",
      });
    }
  }
}
