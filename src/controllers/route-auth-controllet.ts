// import {
//     Body,
//     Controller,
//     Post,
//     UseGuards
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { CurrentUser } from 'src/auth/current-user-decorator';
// import { userPayload } from 'src/auth/jwt.strategy';
// import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe';
// import { z } from 'zod';

// const testSchema = z.object({
//   name: z.string().min(3),
// });

// type TestBody = z.infer<typeof testSchema>;

// @Controller('protected-route')
// export class ProtectedRouteAuthController {
//   constructor() {}

//   @Post()
//   @UseGuards(AuthGuard('jwt'))
//   async handler(
//     @Body(new ZodValidationPipe(testSchema)) body: TestBody,
//     @CurrentUser() user: userPayload
// ) {
//     const { name } = body;

//     console.log('Authenticated user:', user.sub);

//     return { message: `Ok ${name}` };
//   }
// }
