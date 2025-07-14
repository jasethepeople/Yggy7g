import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface GeneratedImage {
  url: string;
  description: string;
}

export interface CrochetPatternAnalysis {
  stitchTypes: string[];
  colorRegions: { color: string; percentage: number }[];
  complexity: "simple" | "intermediate" | "advanced";
  estimatedTime: string;
  difficulty: string;
  instructions: string[];
}

export async function generateImageFromText(description: string): Promise<GeneratedImage> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a detailed, high-contrast image suitable for crochet pattern conversion: ${description}. The image should have clear, defined shapes and colors that can be easily translated into stitches.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return {
      url: response.data[0].url || "",
      description: description,
    };
  } catch (error) {
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

export async function analyzeImageForPattern(base64Image: string): Promise<CrochetPatternAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert crochet pattern designer. Analyze the provided image and create a detailed crochet pattern analysis. Respond with JSON in this exact format:
          {
            "stitchTypes": ["sc", "dc", "ch"],
            "colorRegions": [{"color": "#FF6B9D", "percentage": 60}, {"color": "#FFFFFF", "percentage": 40}],
            "complexity": "simple|intermediate|advanced",
            "estimatedTime": "8-12 hours",
            "difficulty": "Beginner|Intermediate|Advanced",
            "instructions": ["Step 1...", "Step 2..."]
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image for crochet pattern conversion. Identify the main colors, suggest appropriate stitch types, estimate complexity and time, and provide basic assembly instructions."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as CrochetPatternAnalysis;
  } catch (error) {
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

export async function generatePatternInstructions(
  patternData: any,
  analysis: CrochetPatternAnalysis
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert crochet pattern writer. Create detailed, step-by-step crochet instructions based on the pattern data provided. Include materials list, abbreviations, and clear round-by-round or row-by-row instructions."
        },
        {
          role: "user",
          content: `Create detailed crochet instructions for this pattern:
          Pattern Analysis: ${JSON.stringify(analysis)}
          Pattern Data: ${JSON.stringify(patternData)}
          
          Include:
          1. Materials needed
          2. Abbreviations used
          3. Step-by-step instructions
          4. Assembly instructions
          5. Finishing details`
        },
      ],
      max_tokens: 2000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error(`Failed to generate instructions: ${error.message}`);
  }
}
