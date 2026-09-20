import { ApiProperty } from "@nestjs/swagger"

export interface IResultBase {
  status: number
  message: string
}

export interface IResult<T> extends IResultBase {
  data?: T
}

export class Result<T> implements IResult<T> {
  @ApiProperty()
  status: number
  @ApiProperty()
  message: string
  @ApiProperty()
  data?: T

  constructor(status: number, message: string, data?: T) {
    this.status = status
    this.message = message
    this.data = data
  }

  static success<T>(data: T, message = "Request successfully"): Result<T> {
    return new Result<T>(200, message, data)
  }

  static created<T>(data: T, message = "Created successfully"): Result<T> {
    return new Result<T>(201, message, data)
  }

  static accepted<T>(data: T, message = "Accepted"): Result<T> {
    return new Result<T>(202, message, data)
  }

  static noContent(message = "No Content"): Result<null> {
    return new Result<null>(204, message, null)
  }

  static error(message: string, status = 400): Result<null> {
    return new Result<null>(status, message, null)
  }

  static failure(message: string, status = 500): Result<null> {
    return new Result<null>(status, message, null)
  }

  static unauthorized(message = "Unauthorized"): Result<null> {
    return new Result<null>(401, message, null)
  }

  static forbidden(message = "Forbidden"): Result<null> {
    return new Result<null>(403, message, null)
  }

  static notFound(message = "Resource not found"): Result<null> {
    return new Result<null>(404, message, null)
  }

  static badRequest(message = "Bad Request"): Result<null> {
    return new Result<null>(400, message, null)
  }

  static internalError(message = "Internal Server Error"): Result<null> {
    return new Result<null>(500, message, null)
  }
}

export class PagedResult<T> implements IResultBase {
  @ApiProperty()
  status: number

  @ApiProperty()
  message: string

  @ApiProperty({ type: [Object] })
  data: ReadonlyArray<T>

  @ApiProperty()
  totalCount: number

  constructor(
    data: ReadonlyArray<T>,
    totalCount: number,
    status: number = 200,
    message: string = "Request successful",
  ) {
    this.status = status
    this.message = message
    this.data = data
    this.totalCount = totalCount
  }

  static success<T>(
    data: ReadonlyArray<T>,
    totalCount: number,
    message = "Request successful",
  ): PagedResult<T> {
    return new PagedResult<T>(data, totalCount, 200, message)
  }

  static failure<T>(message = "Request failed", status = 500): PagedResult<T> {
    return new PagedResult<T>([], 0, status, message)
  }
}
