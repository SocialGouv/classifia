import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Queue } from 'bullmq';

import { CONVERSATIONS_JOBS } from '../conversations/conversations.job';

import { CrispConversationResponse } from './crisp.interface';

import type { Env } from '@/core/config/app.schema.config';

@Injectable()
export class CrispService {
  private readonly crispApi: AxiosInstance;

  constructor(
    private readonly configService: ConfigService<Env, true>,
    @InjectQueue('conversations')
    private readonly conversationsQueue: Queue,
  ) {
    this.crispApi = axios.create({
      baseURL: this.configService.getOrThrow('CRISP_URL'),
      headers: {
        Authorization: `Basic ${this.configService.getOrThrow('CRISP_API_KEY')}`,
        'X-Crisp-Tier': 'plugin',
      },
    });
  }

  async getConversations() {
    const response = await this.crispApi.get('/conversations', {
      params: {
        filter_resolved: 1,
      },
    });
    return response.data;
  }

  async getConversationMessages(
    conversationId: string,
  ): Promise<CrispConversationResponse> {
    const response = await this.crispApi.get(
      `/conversation/${conversationId}/messages`,
    );
    return response.data;
  }

  async webhookMessageUpdated(body: any) {
    const conversationResolved =
      body.data.content.namespace === 'state:resolved';

    if (conversationResolved) {
      const conversationId = body.data.session_id;

      await this.conversationsQueue.add(
        CONVERSATIONS_JOBS.PROCESS_CRISP_CONVERSATION,
        {
          conversation_id: conversationId,
        },
      );
    }

    return { status: 'success' };
  }
}
