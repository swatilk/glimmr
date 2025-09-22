import Replicate from 'replicate';
import OpenAI from 'openai';
import { getRedisClient } from '../config/redis.js';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateNailArt(prompt, style = "realistic", colors = []) {
  try {
    console.log('🎨 Generating nail art:', prompt);

    const enhancedPrompt = `${prompt}, professional nail art photography, high quality, detailed, ${style} style, beautiful hands, perfect nails, studio lighting, ${colors.length > 0 ? `using colors: ${colors.join(', ')}` : ''}`;

    // Try DALL-E first (higher quality)
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "hd"
        });

        return response.data[0].url;
      } catch (dalleError) {
        console.log('DALL-E failed, trying Stable Diffusion:', dalleError.message);
      }
    }

    // Fallback to Stable Diffusion via Replicate
    const output = await replicate.run(
      "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
      {
        input: {
          prompt: enhancedPrompt,
          negative_prompt: "blurry, low quality, distorted, ugly, deformed hands, extra fingers, missing fingers, cartoon",
          width: 512,
          height: 512,
          num_inference_steps: 50,
          guidance_scale: 7.5,
          scheduler: "DPMSolverMultistep"
        }
      }
    );

    return Array.isArray(output) ? output[0] : output;

  } catch (error) {
    console.error('❌ Nail art generation error:', error);
    return null;
  }
}

export async function generateHennaDesign(bodyPart, style, complexity, cultural = 'traditional') {
  try {
    console.log('🎨 Generating henna design:', { bodyPart, style, complexity });

    const prompt = `Intricate ${cultural} ${style} henna design for ${bodyPart}, ${complexity} complexity level, beautiful mehndi patterns, traditional motifs, high detail, black henna on skin, professional photography, cultural authenticity`;

    // Try DALL-E first
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "hd"
        });

        return response.data[0].url;
      } catch (dalleError) {
        console.log('DALL-E failed, trying Stable Diffusion:', dalleError.message);
      }
    }

    // Fallback to Stable Diffusion
    const output = await replicate.run(
      "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
      {
        input: {
          prompt: prompt,
          negative_prompt: "cartoon, low quality, distorted, inappropriate, western tattoo, permanent ink",
          width: 512,
          height: 768,
          num_inference_steps: 50,
          guidance_scale: 8.0
        }
      }
    );

    return Array.isArray(output) ? output[0] : output;

  } catch (error) {
    console.error('❌ Henna generation error:', error);
    return null;
  }
}

export async function generateMoodboard(recommendations, analysis) {
  try {
    const prompt = `Create a beautiful fashion moodboard collage featuring: ${analysis.styleClassification} style outfit in ${analysis.colorPalette.primary.join(', ')} colors, with ${recommendations.jewelry?.necklace?.name}, ${recommendations.makeup?.lips?.color} lipstick, ${recommendations.hair?.styles?.[0]?.name} hairstyle, styled for ${analysis.occasion}, high-end fashion photography, clean layout, Pinterest style moodboard`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd"
    });

    return response.data[0].url;
  } catch (error) {
    console.error('❌ Moodboard generation error:', error);
    return null;
  }
}