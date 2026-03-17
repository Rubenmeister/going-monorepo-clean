import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET", "default-secret"),
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub ?? payload.userId,
      email: payload.email,
      role: (payload.roles?.[0] ?? "user") as "user" | "driver" | "admin",
    };
  }
}
