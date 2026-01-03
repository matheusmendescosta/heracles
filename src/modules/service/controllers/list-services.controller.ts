import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ListServicesService } from '../services/list-services.service';

@Controller()
export class ListServicesController {
  constructor(private listServicesService: ListServicesService) {}

  @Get('services')
  @UseGuards(AuthGuard('jwt'))
  async getAvailableServices() {
    return this.listServicesService.getAvailableServices();
  }
}
