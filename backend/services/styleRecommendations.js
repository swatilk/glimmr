import Anthropic from '@anthropic-ai/sdk';
import { getRedisClient } from '../config/redis.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function getStyleRecommendations(outfitAnalysis, userPreferences = {}) {
  try {
    // Check cache
    const redis = getRedisClient();
    const cacheKey = `recommendations:${JSON.stringify(outfitAnalysis)}:${JSON.stringify(userPreferences)}`.slice(0, 100);
    
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('🎯 Returning cached recommendations');
        return JSON.parse(cached);
      }
    }

    const prompt = `
    Based on this outfit analysis and user preferences, provide comprehensive styling recommendations.
    
    OUTFIT ANALYSIS:
    ${JSON.stringify(outfitAnalysis, null, 2)}
    
    USER PREFERENCES:
    ${JSON.stringify(userPreferences, null, 2)}
    
    Provide recommendations in this EXACT JSON format:
    {
      "jewelry": {
        "necklace": {
          "name": "specific necklace type",
          "description": "detailed description",
          "style": "style category",
          "colors": ["color1", "color2"],
          "length": "chain length",
          "metal": "metal type"
        },
        "earrings": {
          "name": "specific earring type",
          "description": "detailed description", 
          "style": "style category",
          "size": "small/medium/large",
          "metal": "metal type"
        },
        "bracelets": {
          "name": "bracelet type",
          "description": "detailed description",
          "style": "style category",
          "stacking": "single/multiple"
        },
        "rings": {
          "name": "ring type",
          "description": "detailed description",
          "style": "style category",
          "quantity": "number of rings"
        }
      },
      "makeup": {
        "foundation": {
          "coverage": "light/medium/full",
          "finish": "matte/dewy/satin",
          "undertone": "warm/cool/neutral"
        },
        "eyes": {
          "eyeshadow": {
            "colors": ["color1", "color2", "color3"],
            "finish": "matte/shimmer/metallic",
            "intensity": "subtle/medium/bold"
          },
          "eyeliner": {
            "style": "none/thin/winged/smoky",
            "color": "black/brown/colored"
          },
          "mascara": {
            "type": "lengthening/volumizing",
            "color": "black/brown"
          }
        },
        "lips": {
          "color": "specific color recommendation",
          "finish": "matte/glossy/satin",
          "intensity": "sheer/medium/bold"
        },
        "blush": {
          "color": "color recommendation",
          "placement": "cheeks/cheekbones",
          "intensity": "light/medium"
        }
      },
      "hair": {
        "styles": [
          {
            "name": "hairstyle name",
            "description": "detailed description",
            "difficulty": "easy/medium/hard",
            "occasion": "best occasion for this style"
          }
        ],
        "accessories": [
          {
            "name": "accessory name",
            "description": "how to use it",
            "color": "recommended color"
          }
        ]
      },
      "nails": {
        "colors": ["primary color", "accent color"],
        "designs": ["design1", "design2"],
        "length": "short/medium/long",
        "artStyle": "minimalist/bold/themed",
        "shape": "round/square/oval/almond"
      },
      "henna": {
        "complexity": "simple/medium/intricate",
        "style": "traditional/modern/fusion",
        "placement": ["hands", "feet", "arms"],
        "patterns": ["pattern1", "pattern2", "pattern3"],
        "cultural": "cultural style if applicable"
      }
    }
    
    Consider:
    - Color harmony with the outfit
    - Occasion appropriateness
    - Skin tone compatibility
    - User's style preferences
    - Cultural sensitivity for henna designs
    - Seasonal trends
    `;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid response format from recommendations API');
    }

    const recommendations = JSON.parse(jsonMatch[0]);

    // Cache the result
    if (redis) {
      await redis.setex(cacheKey, 1800, JSON.stringify(recommendations)); // Cache for 30 minutes
    }

    console.log('✅ Style recommendations generated successfully');
    return recommendations;

  } catch (error) {
    console.error('❌ Style recommendations error:', error);
    
    // Fallback recommendations
    return getFallbackRecommendations(outfitAnalysis);
  }
}

function getFallbackRecommendations(analysis) {
  return {
    jewelry: {
      necklace: {
        name: "Simple Chain Necklace",
        description: "A delicate chain that complements your neckline",
        style: "minimalist",
        colors: ["gold", "silver"],
        length: "medium",
        metal: "gold"
      },
      earrings: {
        name: "Stud Earrings",
        description: "Classic studs that work with any outfit",
        style: "classic",
        size: "small",
        metal: "gold"
      },
      bracelets: {
        name: "Simple Bracelet",
        description: "A thin bracelet to add subtle elegance",
        style: "minimalist",
        stacking: "single"
      },
      rings: {
        name: "Simple Ring",
        description: "One or two simple rings",
        style: "minimalist",
        quantity: "1-2"
      }
    },
    makeup: {
      foundation: {
        coverage: "medium",
        finish: "satin",
        undertone: analysis.skinTone
      },
      eyes: {
        eyeshadow: {
          colors: ["neutral", "brown", "taupe"],
          finish: "matte",
          intensity: "subtle"
        },
        eyeliner: {
          style: "thin",
          color: "brown"
        },
        mascara: {
          type: "lengthening",
          color: "black"
        }
      },
      lips: {
        color: "nude pink",
        finish: "satin",
        intensity: "medium"
      },
      blush: {
        color: "peachy pink",
        placement: "cheeks",
        intensity: "light"
      }
    },
    hair: {
      styles: [
        {
          name: "Natural Waves",
          description: "Soft, natural-looking waves",
          difficulty: "easy",
          occasion: analysis.occasion
        }
      ],
      accessories: [
        {
          name: "Hair Clip",
          description: "Simple clip to keep hair in place",
          color: "neutral"
        }
      ]
    },
    nails: {
      colors: analysis.colorPalette.primary,
      designs: ["solid color", "french tips"],
      length: "medium",
      artStyle: "minimalist",
      shape: "oval"
    },
    henna: {
      complexity: "simple",
      style: "traditional",
      placement: ["hands"],
      patterns: ["floral", "geometric"],
      cultural: "traditional"
    }
  };
}