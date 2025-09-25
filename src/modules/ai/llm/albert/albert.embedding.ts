import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { ALBERT_MODELS } from './albert.interface';

import type { AxiosInstance } from 'axios';

import { Env } from '@/core/config/app/app.schema.config';

@Injectable()
export class AlbertEmbedding {
  private readonly albertApi: AxiosInstance;
  private readonly model: string;

  constructor(private readonly configService: ConfigService<Env, true>) {
    this.albertApi = axios.create({
      baseURL: this.configService.getOrThrow('ALBERT_URL'),
      headers: {
        Authorization: `Bearer ${this.configService.getOrThrow('ALBERT_API_KEY')}`,
        'Content-Type': 'application/json',
      },
    });
    this.model = ALBERT_MODELS.embeddings_small.id;
  }

  async embed(text: string | string[]) {
    const response = await this.albertApi.post('/embeddings', {
      input: text,
      model: this.model,
      dimensions: 1024,
    });
    return response.data.data.map((item: any) => item.embedding);
  }
}
