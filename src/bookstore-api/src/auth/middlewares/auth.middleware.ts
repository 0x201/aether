import { Injectable, NestMiddleware } from "@nestjs/common";
import { UserContextService } from "../services/user-context.service";
import { Request, NextFunction } from "express";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private readonly userContext: UserContextService) { }

    use(req: Request, res: Response, next: NextFunction) {
        if (req.user) {
            this.userContext.setUser(req.user);
        }
        next();
    }
}
