import OpenAI from 'openai';
import { getRedisClient } from '../config/redis.js';
import { extractColors, calculateConfidence } from '../utils/helpers.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeOutfit(imageBase64, userId = null) {
  try {
    // Check cache first
    const redis = getRedisClient();
    const imageHash = Buffer.from(imageBase64).toString('base64').slice(0, 32);
    const cacheKey = `analysis:${imageHash}`;
    
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('🎯 Returning cached analysis');
        return JSON.parse(cached);
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this outfit photo and provide detailed style analysis. Return ONLY valid JSON with this exact structure:
              {
                "colorPalette": {
                  "primary": ["#HEX1", "#HEX2"],
                  "secondary": ["#HEX3", "#HEX4"],
                  "accent": ["#HEX5", "#HEX6"]
                },
                "styleClassification": "string (e.g., casual, formal, bohemian, minimalist)",
                "neckline": "string (e.g., crew neck, v-neck, off-shoulder, strapless)",
                "fabric": "string (e.g., cotton, silk, denim, wool)",
                "aesthetic": "string (e.g., modern, vintage, romantic, edgy)",
                "skinTone": "string (warm, cool, neutral)",
                "occasion": "string (work, casual, date, party, wedding, festival)",
                "confidence": number (0-100)
              }
              
              Focus on:
              - Extract exact hex color codes from the outfit
              - Identify the dominant style elements
              - Determine skin tone if visible (face/hands/arms)
              - Suggest best occasion for this outfit
              - Rate confidence in analysis accuracy`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    
    // Clean up the response to ensure valid JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from vision API');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Validate and enhance the analysis
    const enhancedAnalysis = {
      colorPalette: {
        primary: analysis.colorPalette?.primary || ['#000000', '#333333'],
        secondary: analysis.colorPalette?.secondary || ['#666666', '#999999'],
        accent: analysis.colorPalette?.accent || ['#cccccc', '#ffffff']
      },
      styleClassification: analysis.styleClassification || 'casual',
      neckline: analysis.neckline || 'unknown',
      fabric: analysis.fabric || 'unknown',
      aesthetic: analysis.aesthetic || 'modern',
      skinTone: analysis.skinTone || 'neutral',
      occasion: analysis.occasion || 'casual',
      confidence: Math.min(Math.max(analysis.confidence || 75, 0), 100)
    };

    // Cache the result
    if (redis) {
      await redis.setex(cacheKey, 3600, JSON.stringify(enhancedAnalysis)); // Cache for 1 hour
    }

    console.log('✅ Vision analysis completed successfully');
    return enhancedAnalysis;

  } catch (error) {
    console.error('❌ Vision analysis error:', error);
    
    // Fallback analysis
    return {
      colorPalette: {
        primary: ['#2C3E50', '#34495E'],
        secondary: ['#95A5A6', '#BDC3C7'],
        accent: ['#ECF0F1', '#FFFFFF']
      },
      styleClassification: 'casual',
      neckline: 'unknown',
      fabric: 'unknown',
      aesthetic: 'modern',
      skinTone: 'neutral',
      occasion: 'casual',
      confidence: 50
    };
  }
}

export async function analyzeColorPalette(imageBase64) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract the dominant colors from this image. Return ONLY a JSON array of hex color codes in order of dominance: ["#HEX1", "#HEX2", "#HEX3", "#HEX4", "#HEX5", "#HEX6"]`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 200,
      temperature: 0.1
    });

    const colors = JSON.parse(response.choices[0].message.content);
    return extractColors(colors);
  } catch (error) {
    console.error('Color analysis error:', error);
    return {
      primary: ['#2C3E50', '#34495E'],
      secondary: ['#95A5A6', '#BDC3C7'],
      accent: ['#ECF0F1', '#FFFFFF']
    };
  }
}