import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user-decorator';
import { userPayload } from 'src/auth/jwt.strategy';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller()
export class GetUserController {
  constructor(private prisma: PrismaService) {}

  @Get('/user')
  @UseGuards(AuthGuard('jwt'))
  async handler(@CurrentUser() userData: userPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: userData.sub },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
