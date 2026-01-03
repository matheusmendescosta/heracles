// import { Controller, Get, UseGuards } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { PrismaService } from 'src/prisma/prisma.service';

// @Controller()
// export class GetServicesController {
//   constructor(private prisma: PrismaService) {}

//   @Get('services')
//   @UseGuards(AuthGuard('jwt'))
//   async getAvailableServices() {
//     const services = await this.prisma.service.findMany({
//       include: {
//         serviceOptions: true,
//       },
//     });

//     return { services };
//   }
// }
