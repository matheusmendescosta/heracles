import { Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

// const createAccountBodySchema = z.object({
//   name: z.string().min(3),
//   email: z.string().email(),
//   password: z.string().min(6),
//   role: z.nativeEnum(Role).default(Role.CONSULTANT),
// });

// type CreateAccountBody = z.infer<typeof createAccountBodySchema>;

@Controller('sessions')
export class AuthenticateController {
  constructor(private jwt: JwtService) {}

  @Post()
  //   @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handler() {
    const token = this.jwt.sign({
      sub: 'user-id-example',
    });

    return token;
  }
}
