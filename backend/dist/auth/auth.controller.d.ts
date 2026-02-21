import { AuthService } from './auth.service';
declare class LoginDto {
    email: string;
    password: string;
}
declare class RegisterDto {
    email: string;
    password: string;
    name?: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    me(req: {
        user?: {
            id: string;
            email: string;
            name?: string | null;
            role?: string;
            permissions?: string[];
        };
    }): Promise<{
        id: string;
        email: string;
        name?: string | null;
        role?: string;
        permissions?: string[];
    } | undefined>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            role: import("@prisma/client").$Enums.UserRole;
        };
    }>;
}
export {};
