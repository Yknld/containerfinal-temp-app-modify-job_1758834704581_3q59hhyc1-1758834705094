import type { ApiResponse } from '../types';

const API_BASE_URL = 'https://web-production-f4992.up.railway.app';
const API_KEY = 'pk-a34905daf4a6851d791c2491c0a7b91a8a7fbb03070ee57a1cd846a743537182';

export class AIService {
  private static async makeRequest(endpoint: string, body: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  static async analyzeImage(imageBase64: string, question?: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful homework assistant. When analyzing images, provide clear, step-by-step solutions. Always show your work and explain each step. Format your response with clear sections for the answer and steps to solve.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: question || 'Please analyze this homework problem and provide a step-by-step solution.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ];

    const response: ApiResponse = await this.makeRequest('/v1/chat/completions', {
      model: 'gpt-4-vision-preview',
      messages,
      max_tokens: 1000,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || 'Sorry, I could not analyze this image.';
  }

  static async askQuestion(question: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful homework assistant. Provide clear, step-by-step solutions to academic questions. Always show your work and explain each step. Format your response with clear sections for the answer and steps to solve.'
      },
      {
        role: 'user',
        content: question
      }
    ];

    const response: ApiResponse = await this.makeRequest('/v1/chat/completions', {
      model: 'gpt-4',
      messages,
      max_tokens: 1000,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || 'Sorry, I could not process your question.';
  }

  static parseSteps(content: string): string[] {
    // Extract steps from the AI response
    const lines = content.split('\n');
    const steps: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^(Step \d+|^\d+\.|\*\s)/i) || 
          trimmed.match(/^(First|Second|Third|Next|Then|Finally)/i)) {
        steps.push(trimmed);
      }
    }
    
    return steps.length > 0 ? steps : [content];
  }
}