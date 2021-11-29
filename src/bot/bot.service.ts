import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { BotApiModuleOptions } from './bot.constant';

@Injectable()
export class BotService {
  constructor(@Inject('CONFIG_OPTIONS') private readonly options: BotApiModuleOptions) {}

  private getHeader(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.options.AppKey}`,
      'Content-Type': 'application/json',
    };
  }

  async findByEmail(email: string): Promise<{ data: Record<string, any> }> {
    return axios({
      method: 'get',
      headers: this.getHeader(),
      url: this.options.ApiUrl + `users.find_by_email?email=${email}`,
    });
  }

  async openConversation(userId: number): Promise<{ data: Record<string, any> }> {
    const data = `user_id=${userId}`;
    return axios({
      method: 'post',
      headers: this.getHeader(),
      url: this.options.ApiUrl + 'conversations.open',
      data,
    });
  }

  async sendMessage(roomId: number, text: string): Promise<{ data: Record<string, any> }> {
    const data = {
      conversation_id: roomId,
      text,
    };
    return axios({
      method: 'post',
      headers: this.getHeader(),
      url: this.options.ApiUrl + 'messages.send',
      data,
    });
  }

  async sendMessageByEmail(email: string, text: string): Promise<{ data: Record<string, any> }> {
    const data = {
      email,
      text,
    };
    return axios({
      method: 'post',
      headers: this.getHeader(),
      url: this.options.ApiUrl + 'messages.send_by_email',
      data,
    });
  }

  async sendBlockMessageByEmail(email: string, message: string): Promise<{ data: Record<string, any> }> {
    const data = {
      email,
      text: message,
      blocks: [
        {
          type: 'text',
          text: 'text sample',
          inlines: [
            {
              type: 'styled',
              text: message,
              bold: true,
              color: 'default',
            },
          ],
        },
        {
          type: 'context',
          content: {
            type: 'text',
            text: '빅게임 스튜디오',
            inlines: [
              {
                type: 'link',
                text: '빅게임 스튜디오',
                url: 'https://conf.vicgamestudios.com',
              },
            ],
          },
          image: {
            type: 'image_link',
            url: 'https://www.vicgamestudios.com/careerImg/vic_logo_small.png',
          },
        },
      ],
    };

    return axios({
      method: 'post',
      headers: this.getHeader(),
      url: this.options.ApiUrl + 'messages.send_by_email',
      data,
    });
  }
}
