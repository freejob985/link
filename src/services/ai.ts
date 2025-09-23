import { AIsuggestion } from '../types';

class AIService {
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  
  async suggestDescriptionAndTags(url: string, name?: string): Promise<AIsuggestion> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('لم يتم تكوين مفتاح Gemini API');
    }

    const prompt = `
      اقترح وصفاً مختصراً (لا يزيد عن 100 حرف) و 5 كلمات دلالية مناسبة لهذا الرابط:
      الرابط: ${url}
      ${name ? `الاسم: ${name}` : ''}
      
      أجب بصيغة JSON فقط:
      {
        "description": "وصف مختصر باللغة العربية",
        "tags": ["كلمة1", "كلمة2", "كلمة3", "كلمة4", "كلمة5"]
      }
    `;

    try {
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
        description: result.description || '',
        tags: result.tags || []
      };
    } catch (error) {
      console.error('خطأ في استدعاء Gemini API:', error);
      throw new Error('فشل في الحصول على اقتراحات من الذكاء الاصطناعي');
    }
  }
}

export const aiService = new AIService();