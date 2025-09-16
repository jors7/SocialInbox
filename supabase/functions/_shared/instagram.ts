const INSTAGRAM_API_BASE_URL = 'https://graph.facebook.com/v18.0';

export interface SendMessageOptions {
  recipient: { id: string };
  message: {
    text?: string;
    quick_replies?: Array<{
      content_type: 'text';
      title: string;
      payload: string;
    }>;
    attachment?: {
      type: 'image' | 'video' | 'audio' | 'file';
      payload: {
        url: string;
      };
    };
  };
  messaging_type?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
  tag?: string;
}

export class InstagramClient {
  constructor(private accessToken: string) {}

  async sendMessage(options: SendMessageOptions): Promise<any> {
    const response = await fetch(`${INSTAGRAM_API_BASE_URL}/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...options,
        access_token: this.accessToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  async sendTextMessage(recipientId: string, text: string, tag?: string): Promise<any> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: tag ? 'MESSAGE_TAG' : 'RESPONSE',
      tag,
    });
  }

  async sendQuickReply(
    recipientId: string,
    text: string,
    quickReplies: Array<{ title: string; payload: string }>
  ): Promise<any> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: {
        text,
        quick_replies: quickReplies.map((qr) => ({
          content_type: 'text',
          title: qr.title,
          payload: qr.payload,
        })),
      },
    });
  }

  async sendMedia(recipientId: string, mediaUrl: string, mediaType: 'image' | 'video'): Promise<any> {
    return this.sendMessage({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: mediaType,
          payload: {
            url: mediaUrl,
          },
        },
      },
    });
  }

  async getUserProfile(userId: string): Promise<any> {
    const response = await fetch(
      `${INSTAGRAM_API_BASE_URL}/${userId}?fields=name,profile_pic&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  async postComment(objectId: string, message: string): Promise<any> {
    const response = await fetch(`${INSTAGRAM_API_BASE_URL}/${objectId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        access_token: this.accessToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }
}