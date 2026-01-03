import { Injectable } from '@nestjs/common';
import { ListServicesRepository } from '../repositories/list-services.repository';

@Injectable()
export class ListServicesService {
  constructor(private listServicesRepository: ListServicesRepository) {}

  async getAvailableServices() {
    const services = await this.listServicesRepository.findAllServices();

    return { services };
  }
}
