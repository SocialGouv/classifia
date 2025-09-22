import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { ALBERT_MODELS, AlbertChatCompletionRequest } from './albert.interface';

import { Env } from '@/core/config/app/app.schema.config';

@Injectable()
export class AlbertService {
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
    this.model = ALBERT_MODELS.albert_small.id;
  }

  async complete(message: string): Promise<string> {
    const request: AlbertChatCompletionRequest = {
      messages: [{ role: 'user', content: message }],
      model: this.model,
    };

    try {
      const response = await this.albertApi.post('/chat/completions', request);
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Albert Chat API error:', error);
      throw new Error(
        `Failed to complete chat: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  async getModels(): Promise<string[]> {
    const response = await this.albertApi.get('/models');
    return response.data.data;
  }
}
