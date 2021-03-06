import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { BotApiModuleOptions } from './bot.constant';
import { User } from '../users/entities/user.entity';
import * as moment from 'moment';
import { TeamMapping } from '../users/entities/users.constants';

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
            text: '????????? ????????????',
            inlines: [
              {
                type: 'link',
                text: '????????? ????????????',
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
      text: '????????? ?????? ?????????',
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
        text: `?????? / ${location} ?????????`,
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
        text: '?????????',
        inlines: [
          {
            type: 'styled',
            text: '?????????',
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
            text: TeamMapping[host.team],
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
        term: '??????',
        content: {
          type: 'text',
          text: moment(date).format('YYYY??? MM??? DD??? HH??? mm???'),
        },
        accent: true,
      },
    ];

    blocks = blocks.concat(dateBlock);

    return blocks;
  }
}
