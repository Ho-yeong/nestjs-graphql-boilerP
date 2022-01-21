import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { BotApiModuleOptions } from './bot.constant';
import { User } from '../users/entities/user.entity';
import * as moment from 'moment';

@Injectable()
export class BotService {
  constructor(@Inject('CONFIG_OPTIONS') private readonly options: BotApiModuleOptions) {}

  private getHeader(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.options.AppKey}`,
      'Content-Type': 'application/json',
    };
  }

  private getHeaderForBot2(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.options.AppKey2}`,
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

  async sendMessageByEmailForFinanceTeam(email: string, text: string): Promise<{ data: Record<string, any> }> {
    const data = {
      email,
      text,
    };
    return axios({
      method: 'post',
      headers: this.getHeaderForBot2(),
      url: this.options.ApiUrl + 'messages.send_by_email',
      data,
    });
  }

  async sendReservationMsgByEmail(email: string, blocks: Record<any, any>[]): Promise<{ data: Record<string, any> }> {
    const data = {
      email,
      text: '회의실 예약 메세지',
      blocks,
    };

    return axios({
      method: 'post',
      headers: this.getHeaderForBot2(),
      url: this.options.ApiUrl + 'messages.send_by_email',
      data,
    });
  }

  makeReservationMsg(location: string, title, host: User, participants: User[], date: Date): Record<any, any>[] {
    let blocks = [
      {
        type: 'header',
        text: `초대 / ${location} 회의실`,
        style: 'blue',
      },
      {
        type: 'text',
        text: `${title}`,
      },
      {
        type: 'divider',
      },
      {
        type: 'text',
        text: '참가자',
        inlines: [
          {
            type: 'styled',
            text: '참가자',
            bold: true,
          },
        ],
      },
      {
        type: 'text',
        text: '...',
        inlines: [
          {
            type: 'styled',
            text: host.team,
            bold: true,
          },
          {
            type: 'styled',
            text: ` ${host.name}`,
            strike: false,
          },
        ],
      },
    ];

    for (const i of participants) {
      blocks.push({
        type: 'text',
        text: '...',
        inlines: [
          {
            type: 'styled',
            text: i.team,
            bold: true,
          },
          {
            type: 'styled',
            text: ` ${i.name}`,
            strike: false,
          },
        ],
      });
    }

    const dateBlock = [
      {
        type: 'divider',
      },
      {
        type: 'description',
        term: '일시',
        content: {
          type: 'text',
          text: moment(date).format('YYYY년 MM월 DD일 HH시 mm분'),
        },
        accent: true,
      },
    ];

    console.log(blocks);

    blocks = blocks.concat(dateBlock);

    return blocks;
  }
}
