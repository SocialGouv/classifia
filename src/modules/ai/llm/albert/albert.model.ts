import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  assistant,
  Model,
  ModelRequest,
  ModelResponse,
  ResponseStreamEvent,
  Usage,
} from '@openai/agents';
import axios, { AxiosInstance } from 'axios';

import { ALBERT_MODELS } from './albert.interface';

@Injectable()
export class AlbertModel implements Model {
  name = 'albert';
  private readonly albertApi: AxiosInstance;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.albertApi = axios.create({
      baseURL: this.configService.getOrThrow('ALBERT_URL'),
      headers: {
        Authorization: `Bearer ${this.configService.getOrThrow('ALBERT_API_KEY')}`,
        'Content-Type': 'application/json',
      },
    });
    this.model = ALBERT_MODELS.albert_small.id;
  }
  async getResponse(req: ModelRequest): Promise<ModelResponse> {
    const prompt =
      typeof req.input === 'string'
        ? req.input
        : Array.isArray(req.input)
          ? req.input
              .map((item: any) => {
                if (typeof item?.content === 'string') return item.content;
                if (Array.isArray(item?.content)) {
                  return item.content
                    .map((c: any) => {
                      if (
                        c?.type === 'input_text' &&
                        typeof c?.text === 'string'
                      )
                        return c.text;
                      if (
                        c?.type === 'audio' &&
                        typeof c?.transcript === 'string'
                      )
                        return c.transcript;
                      return '';
                    })
                    .filter(Boolean)
                    .join('\n');
                }
                return '';
              })
              .filter(Boolean)
              .join('\n')
          : '';

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (req.systemInstructions) {
      messages.push({ role: 'system', content: req.systemInstructions });
    }
    messages.push({ role: 'user', content: prompt });

    const { data } = await this.albertApi.post('/chat/completions', {
      messages,
      model: this.model,
    });

    const text =
      data?.choices?.[0]?.message?.content ??
      (typeof data === 'string' ? data : '');

    return {
      output: [assistant(text as string)],
      usage: new Usage(),
    };
  }

  async *getStreamedResponse(
    req: ModelRequest,
  ): AsyncIterable<ResponseStreamEvent> {
    // Non-streaming minimal implementation: delegate to getResponse and emit a completed event.
    const res = await this.getResponse(req);
    yield { type: 'response_done', response: res };
  }
}
