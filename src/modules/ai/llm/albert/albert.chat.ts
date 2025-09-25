import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import {
  ChatMessage,
  ChatModel,
  ChatOptions,
} from '../../core/chat-model.interface';

import { ALBERT_MODELS, AlbertChatCompletionRequest } from './albert.interface';

import { Env } from '@/core/config/app/app.schema.config';

@Injectable()
export class AlbertChat implements ChatModel {
  private readonly logger = new Logger(AlbertChat.name);
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

  async chat(
    messages: ChatMessage[],
    _opts?: ChatOptions,
  ): Promise<{ content: string }> {
    const request: AlbertChatCompletionRequest = {
      messages,
      model: this.model,
      response_format: { type: 'json_object' },
    };

    try {
      const response = await this.albertApi.post('/chat/completions', request);
      return { content: response.data.choices[0].message.content };
    } catch (error) {
      this.logger.error(
        'Albert Chat API error',
        error instanceof Error ? error.stack : error,
      );

      // Handle different types of errors appropriately
      if (error.response?.status >= 500) {
        throw new ServiceUnavailableException(
          `Albert Chat API is currently unavailable: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      } else if (error.response?.status >= 400) {
        throw new InternalServerErrorException(
          `Albert Chat API request failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      } else {
        throw new InternalServerErrorException(
          `Failed to complete chat: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }
  }
}
