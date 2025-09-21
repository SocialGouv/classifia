import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import type { Env } from '@core/config/app/app.schema.config';

@Injectable()
export class CrispService {
  private readonly crispApi: AxiosInstance;

  constructor(private readonly configService: ConfigService<Env, true>) {
    this.crispApi = axios.create({
      baseURL: this.configService.getOrThrow('CRISP_URL'),
    });
  }

  async getConversation(conversationId: string) {
    const response = await this.crispApi.get(
      `/conversations/${conversationId}`,
    );
    return response.data;
  }
}
