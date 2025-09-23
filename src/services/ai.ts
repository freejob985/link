import { AIsuggestion } from '../types';

class AIService {
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private readonly API_KEYS = [
    'AIzaSyD7jSzV7S-XwRa8L90KVBxM08g7LSMDeGk',
    'AIzaSyCTYH7rvcxwjemRqYO1_zy6fftpXtJ7x7s',
    'AIzaSyCwYAwZIqKE_727iTqIbYWLBvrt8ebW-0k',
    'AIzaSyC2uWuYocXExJfqQxeBaV90ZIvdx1EibCc',
    'AIzaSyDa-Ad3iE6JwBMy5mg9me2vfXbrdI3bLQo'
  ];
  private currentKeyIndex = 0;

  private getCurrentAPIKey(): string {
    return this.API_KEYS[this.currentKeyIndex];
  }

  private rotateAPIKey(): void {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.API_KEYS.length;
  }
  
  async suggestDescriptionAndTags(url: string, name?: string): Promise<AIsuggestion> {
    const maxRetries = this.API_KEYS.length;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const apiKey = this.getCurrentAPIKey();

        const prompt = `
          اقترح اسماً مناسباً ووصفاً مختصراً (لا يزيد عن 100 حرف) و 5 كلمات دلالية مناسبة و رابط أيقونة مناسبة لهذا الرابط:
          الرابط: ${url}
          ${name ? `الاسم الحالي: ${name}` : ''}
          
          أجب بصيغة JSON فقط:
          {
            "name": "اسم مناسب باللغة العربية",
            "description": "وصف مختصر باللغة العربية",
            "tags": ["كلمة1", "كلمة2", "كلمة3", "كلمة4", "كلمة5"],
            "icon": "رابط أيقونة مناسبة من Flaticon أو أي مصدر آخر"
          }
        `;

        const response = await fetch(this.GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        if (!response.ok) {
          if (response.status === 429 || response.status === 403) {
            // Rate limit or quota exceeded, try next key
            this.rotateAPIKey();
            continue;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0]?.content?.parts[0]?.text;
        
        if (!text) {
          throw new Error('لم يتم الحصول على رد من Gemini');
        }

        // استخراج JSON من الرد
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('لم يتم العثور على JSON صالح في الرد');
        }

        const result = JSON.parse(jsonMatch[0]);
        
        return {
          name: result.name || '',
          description: result.description || '',
          tags: result.tags || [],
          icon: result.icon || ''
        };

      } catch (error: unknown) {
        lastError = error as Error;
        console.error(`خطأ في استدعاء Gemini API (محاولة ${attempt + 1}):`, error);
        
        // إذا لم تكن هذه المحاولة الأخيرة، جرب المفتاح التالي
        if (attempt < maxRetries - 1) {
          this.rotateAPIKey();
          continue;
        }
      }
    }

    // إذا فشلت جميع المحاولات
    throw lastError || new Error('فشل في الحصول على اقتراحات من الذكاء الاصطناعي');
  }
}

export const aiService = new AIService();