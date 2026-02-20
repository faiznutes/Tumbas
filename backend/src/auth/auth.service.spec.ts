import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  } as any;

  const jwtService = {
    sign: jest.fn(),
  } as any;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma, jwtService);
  });

  it('returns accessToken and user on login', async () => {
    jest.spyOn(service, 'validateUser').mockResolvedValue({
      id: 'u1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    });
    jwtService.sign.mockReturnValue('jwt-token');

    const result = await service.login('admin@example.com', 'secret123');

    expect(result).toEqual({
      accessToken: 'jwt-token',
      access_token: 'jwt-token',
      user: {
        id: 'u1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'SUPER_ADMIN',
      },
    });
  });

  it('throws unauthorized when account disabled', async () => {
    jest.spyOn(service, 'validateUser').mockResolvedValue({
      id: 'u1',
      email: 'admin@example.com',
      isActive: false,
    });

    await expect(service.login('admin@example.com', 'secret123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('registers user with STAFF role by default', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u2',
      email: 'staff@example.com',
      name: 'Staff',
      role: 'STAFF',
    });
    jwtService.sign.mockReturnValue('new-user-token');

    const result = await service.register('staff@example.com', 'secret123', 'Staff');

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'STAFF',
        }),
      }),
    );
    expect(result.accessToken).toBe('new-user-token');
    expect(result.user.role).toBe('STAFF');
  });

  it('throws conflict when email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(service.register('staff@example.com', 'secret123')).rejects.toThrow(
      ConflictException,
    );
  });
});
