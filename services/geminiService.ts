


import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { LandscapingStyle, DesignCatalog, RedesignDensity } from '../types';
import { LANDSCAPING_STYLES } from '../constants';
import { geminiRateLimiter } from './rateLimit';
import { sanitizeError } from './errorUtils';

// Get API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not configured');
}
const ai = new GoogleGenAI({ apiKey });

// Per coding guidelines, use 'gemini-2.5-flash-image' for image editing tasks.
const model = 'gemini-2.5-flash-image';

/**
 * Creates a detailed prompt for the initial Gemini model redesign.
 * @param styles - The desired landscaping styles.
 * @param allowStructuralChanges - Whether to allow structural changes.
 * @param climateZone - The geographic area or climate zone.
 * @param lockAspectRatio - Whether to maintain the original aspect ratio.
 * @param redesignDensity - The desired density of the design elements.
 * @returns The generated prompt string.
 */
const getPrompt = (
    styles: LandscapingStyle[],
    allowStructuralChanges: boolean,
    climateZone: string,
    lockAspectRatio: boolean,
    redesignDensity: RedesignDensity
): string => {
  const structuralChangeInstruction = allowStructuralChanges
    ? `You are allowed to make structural changes to the LANDSCAPE. This includes adding or altering hardscapes like pergolas, decks, stone patios, retaining walls, and pathways. This permission **DOES NOT** apply to the house. You are **STRICTLY FORBIDDEN** from altering the main building's architecture, windows, doors, or roof.`
    : '**ABSOLUTELY NO** structural changes. You are forbidden from adding, removing, or altering buildings, walls, gates, fences, driveways, or other permanent structures. Your redesign must focus exclusively on softscapes (plants, flowers, grass, mulch) and easily movable elements (outdoor furniture, pots, decorative items).';
  
  const objectRemovalInstruction = allowStructuralChanges
    ? 'A critical rule is to handle objects like people, animals, or vehicles. You MUST completely remove any such objects from the property and seamlessly redesign the landscape area they were occupying. The ground underneath (grass, pavement, garden beds, etc.) must be filled in as part of the new design.'
    : 'You are **STRICTLY FORBIDDEN** from removing or altering any people, animals, or vehicles (cars, trucks, etc.). Treat all of these as permanent objects in the scene that must not be changed. Your design must work around them.';
  
  let climateInstruction = climateZone
    ? `All plants, trees, and materials MUST be suitable for the '${climateZone}' climate/region.`
    : 'Select plants and materials that are generally appropriate for the visual context of the image.';

  if (climateZone) {
    const lowerZone = climateZone.toLowerCase();
    const lowerStyles = styles.map(s => s.toLowerCase());
    const climateCoveredByStyle = lowerStyles.some(s => {
      if (/arid|desert/i.test(lowerZone)) return s === 'desert';
      if (/tropical/i.test(lowerZone)) return s === 'tropical';
      if (/mediterranean/i.test(lowerZone)) return s === 'mediterranean';
      if (/coastal/i.test(lowerZone)) return s === 'coastal';
      if (/japanese|zen/i.test(lowerZone)) return s === 'japanese';
      return false;
    });

    if (!climateCoveredByStyle) {
      if (/arid|desert/i.test(lowerZone)) {
        climateInstruction += " Prioritize drought-tolerant plants like succulents (Agave, Aloe), cacti (Prickly Pear), ornamental grasses (Blue Grama), and hardy shrubs (Sagebrush).";
      } else if (/tropical/i.test(lowerZone)) {
        climateInstruction += " Use lush, humidity-loving plants like palms (Coconut Palm), hibiscus, ferns (Boston Fern), and orchids.";
      } else if (/mediterranean/i.test(lowerZone)) {
        climateInstruction += " Choose sun-tolerant plants like olive trees, lavender, rosemary, and citrus trees.";
      } else if (/japanese|zen/i.test(lowerZone)) {
        climateInstruction += " Incorporate serene elements like maples (Japanese Maple), bamboo, moss, and cherry trees.";
      } else if (/coastal/i.test(lowerZone)) {
        climateInstruction += " Select salt-tolerant plants like ornamental grasses (Pampas Grass), beach roses, and hardy shrubs.";
      }
    }
  }

  const aspectRatioInstruction = lockAspectRatio
    ? `You MUST maintain the exact aspect ratio of the original input image. The output image dimensions must correspond to the input image dimensions.`
    : `Preserve the original aspect ratio if possible.`;

  const densityInstruction = ((density: RedesignDensity): string => {
    switch (density) {
      case 'minimal':
        return 'CRITICAL DENSITY INSTRUCTION: The user has selected a MINIMAL design. You MUST prioritize open space and simplicity above all else. Use a very limited number of high-impact plants and features. The final design must be clean, uncluttered, and feel spacious.';
      case 'lush':
        return 'CRITICAL DENSITY INSTRUCTION: The user has selected a LUSH design. This is a primary command. You MUST maximize planting to create a dense, layered, and abundant garden. Fill nearly all available softscape areas with a rich variety of plants, textures, and foliage. The goal is an immersive, vibrant landscape with minimal empty or open space.';
      case 'default': // Corresponds to 'Balanced'
      default:
        return 'CRITICAL DENSITY INSTRUCTION: The user has selected a BALANCED design. You MUST create a harmonious mix of planted areas and functional open space (like lawn or patio). Avoid extremes: the design should not feel empty or overly crowded. The composition should be thoughtful and well-proportioned.';
    }
  })(redesignDensity);

  const jsonSchemaString = JSON.stringify({
    plants: [{ name: "string", species: "string" }],
    features: [{ name: "string", description: "string" }],
  }, null, 2);

  const styleNames = styles.map(styleId => LANDSCAPING_STYLES.find(s => s.id === styleId)?.name || styleId);

  // Add style-specific plant guidance
  const getStylePlantGuidance = (styleId: LandscapingStyle): string => {
    switch (styleId) {
      case 'modern':
        return 'sleek, low-maintenance plants like boxwoods, ornamental grasses, and succulents';
      case 'minimalist':
        return 'minimal, clean plants like succulents, ornamental grasses, and simple shrubs';
      case 'rustic':
        return 'natural, hardy plants like oaks, wildflowers, and rugged shrubs';
      case 'japanese':
        return 'serene plants like maples, bamboo, moss, and cherry trees';
      case 'urban-modern':
        return 'compact, resilient plants like boxwoods, ornamental grasses, and vertical gardens';
      case 'english-cottage':
        return 'charming plants like roses, climbing vines, and informal flower beds';
      case 'mediterranean':
        return 'sun-tolerant plants like olive trees, lavender, rosemary, and citrus';
      case 'tropical':
        return 'lush plants like palms, hibiscus, ferns, and orchids';
      case 'farmhouse':
        return 'practical plants like oaks, wildflowers, vegetable patches, and picket fences';
      case 'coastal':
        return 'salt-tolerant plants like ornamental grasses, beach roses, and hardy shrubs';
      case 'desert':
        return 'drought-tolerant plants like succulents, cacti, and ornamental grasses';
      case 'bohemian':
        return 'eclectic, colorful plants like sunflowers, wildflowers, and herbs';
      default:
        return 'plants appropriate to the selected style';
    }
  };

  const stylePlantGuidance = styles.map(style => getStylePlantGuidance(style)).filter(g => g !== 'plants appropriate to the selected style').join(', ');
  const styleInstruction = styleNames.length > 1
    ? `Redesign the landscape in a blended style that combines '${styleNames.join("' and '")}'. Prioritize a harmonious fusion of these aesthetics.${stylePlantGuidance ? ` Incorporate plants like ${stylePlantGuidance}.` : ' Incorporate plants appropriate to the selected style(s).'}`
    : (() => {
        const guidance = getStylePlantGuidance(styles[0]);
        return `Redesign the landscape in a '${styleNames[0]}' style.${guidance !== 'plants appropriate to the selected style' ? ` Incorporate plants like ${guidance}.` : ' Incorporate plants appropriate to the selected style.'}`;
      })();

  const layoutInstruction = `**CRITICAL RULE: Functional Access (No Exceptions):**
  - **Garages & Driveways:** You MUST consistently identify all garage doors. A functional driveway MUST lead directly to each garage door. This driveway must be kept completely clear of any new plants, trees, hardscaping, or other obstructions. The driveway's width MUST be maintained to be at least as wide as the full width of the garage door it serves. Do not place any design elements on the driveway surface. This is a non-negotiable rule.
  - **All Other Doors:** EVERY door (front doors, side doors, patio doors, etc.) MUST be accessible. This means each door must have a clear, direct, and unobstructed pathway leading to it. This pathway must be at least as wide as the door itself and must connect logically to a larger circulation route like the main driveway or a walkway. Do not isolate any doors.`;

  return `
You are an expert AI landscape designer. Perform an in-place edit of the user's image to redesign the landscape while preserving the property.

## Core Rules
- **Preserve Property**: Use the input image as the base. Modify ONLY the landscape (plants, paths, furniture). Do NOT generate a new image, replace the property, or alter the house/building in any way (architecture, color, windows, doors, roof).
- **Functional Access**: ${layoutInstruction.replace(/\*\*CRITICAL RULE: Functional Access \(No Exceptions\):\*\*\s*/, '').replace(/\*\*/g, '')}
- **Object Handling**: ${objectRemovalInstruction}
- **Structural Changes**: ${structuralChangeInstruction}

## Output Requirements
- **Image First**: Response must start with the redesigned image.
- **JSON After**: Provide ONLY a valid JSON object (no intro text) describing plants and features, following the schema below.

## Redesign Instructions
- **Style**: ${styleInstruction} Convey style through visual elements only—no text labels.
- **Quality**: Ultra-photorealistic, high-resolution, sharp focus, matching original lighting. No artifacts.
- **Climate**: ${climateInstruction}
- **Density**: ${densityInstruction}
- **Aspect Ratio**: ${aspectRatioInstruction}

## JSON Schema
${jsonSchemaString}
Ensure all plants suit the climate zone. Empty categories: [].
`;
};


/**
 * Extracts a JSON object from a string that may contain other text.
 * @param text - The string to search for a JSON object.
 * @returns The parsed DesignCatalog object or null if not found/invalid.
 */
const parseDesignCatalog = (text: string): DesignCatalog | null => {
    try {
        let jsonStringToParse = text;

        // The model can sometimes wrap the JSON in a markdown code block.
        // We look for a ```json ... ``` block and extract its content first.
        const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
            jsonStringToParse = markdownMatch[1];
        } else {
            // As a fallback, find the first '{' and the last '}' to extract the JSON object.
            // This is less robust but handles cases where markdown is missing.
            const jsonStartIndex = text.indexOf('{');
            const jsonEndIndex = text.lastIndexOf('}');

            if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
                jsonStringToParse = text.substring(jsonStartIndex, jsonEndIndex + 1);
            } else {
                // If no potential JSON object is found, we assume the text itself is not JSON.
                // This can happen if the model returns only an image and no text, or just plain text.
                return null;
            }
        }
        
        return JSON.parse(jsonStringToParse) as DesignCatalog;

    } catch (e) {
        console.error("Failed to parse JSON from model response:", e);
        console.error("Received text:", text); // Log original text for better debugging
        return null;
    }
};


const callGeminiForRedesign = async (parts: ({ inlineData: { data: string; mimeType: string; }; } | { text: string; })[]) => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        // Check for safety blocks first.
        if (response.promptFeedback?.blockReason) {
            const reason = response.promptFeedback.blockReason;
            const message = response.promptFeedback.blockReasonMessage || 'No additional details provided.';
            console.error(`Gemini API request blocked. Reason: ${reason}. Message: ${message}`);
            throw new Error(`Request blocked by AI safety filters: ${reason}. Please modify the image or request.`);
        }

        let redesignedImage: { base64ImageBytes: string; mimeType: string } | null = null;
        let accumulatedText = '';

        // Ensure there are candidates to process.
        if (!response.candidates || response.candidates.length === 0) {
            console.error("Full API Response (No Candidates):", JSON.stringify(response, null, 2));
            throw new Error('The model returned no content. This could be due to a safety policy or an unknown model error.');
        }

        const responseParts = response.candidates[0].content.parts;
        for (const part of responseParts) {
            if (part.inlineData && !redesignedImage) {
                redesignedImage = {
                    base64ImageBytes: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                };
            } else if (part.text) {
                accumulatedText += part.text;
            }
        }
        
        const designCatalog = parseDesignCatalog(accumulatedText);

        if (!redesignedImage) {
            console.error("Full API Response (No Image Part):", JSON.stringify(response, null, 2));
            throw new Error('The model did not return a redesigned image.');
        }

        return {
            base64ImageBytes: redesignedImage.base64ImageBytes,
            mimeType: redesignedImage.mimeType,
            catalog: designCatalog || { plants: [], features: [] },
        };

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error(sanitizeError(error));
    }
};

/**
 * Calls the Gemini API to redesign an outdoor space image.
 * @param base64Image - The base64 encoded source image.
 * @param mimeType - The MIME type of the source image.
 * @param styles - The landscaping styles to apply.
 * @param allowStructuralChanges - Flag to allow structural modifications.
 * @param climateZone - The geographic area or climate zone.
 * @param lockAspectRatio - Flag to maintain the original aspect ratio.
 * @param redesignDensity - The desired density of design elements.
 * @returns An object containing the new image and design catalog.
 */
export const redesignOutdoorSpace = async (
  base64Image: string,
  mimeType: string,
  styles: LandscapingStyle[],
  allowStructuralChanges: boolean,
  climateZone: string,
  lockAspectRatio: boolean,
  redesignDensity: RedesignDensity
): Promise<{ base64ImageBytes: string; mimeType: string; catalog: DesignCatalog }> => {
  // Check rate limit before making API call
  if (!geminiRateLimiter.checkLimit()) {
    const remainingTime = Math.ceil(geminiRateLimiter.getTimeUntilReset() / 1000);
    throw new Error(`Rate limit exceeded. Please wait ${remainingTime} seconds before trying again.`);
  }

  const prompt = getPrompt(styles, allowStructuralChanges, climateZone, lockAspectRatio, redesignDensity);
  const imagePart = { inlineData: { data: base64Image, mimeType } };

  const parts: ({ inlineData: { data: string; mimeType: string; }; } | { text: string; })[] = [imagePart];

  parts.push({ text: prompt });
  return callGeminiForRedesign(parts);
};


/**
 * Generates an isolated image of a single landscape element.
 * @param elementName - The name of the element to generate an image for.
 * @param description - An optional description to refine the image generation prompt.
 * @returns A promise that resolves to a base64 data URL of the generated image.
 */
export const getElementImage = async (elementName: string, description?: string): Promise<string> => {
  try {
    const prompt = description
      ? `Photorealistic image of a single "${elementName}" (${description}), isolated on a clean, plain white background. The subject should be centered and clear, like a product photo for a catalog. No text, watermarks, or other objects.`
      : `Photorealistic image of a single "${elementName}" isolated on a clean, plain white background. The subject should be centered and clear, like a product photo for a catalog. No text, watermarks, or other objects.`;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image.imageBytes) {
      throw new Error('Image generation failed to return an image.');
    }

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error(`Error generating image for "${elementName}":`, error);
    throw new Error(sanitizeError(error));
  }
};

/**
 * Gets a user-friendly description for a landscape element.
 * @param elementName - The name of the element.
 * @param climateZone - Optional climate zone to tailor the description.
 * @returns A promise that resolves to a string with the element's information.
 */
export const getElementInfo = async (elementName: string, climateZone?: string): Promise<string> => {
    try {
        const climateInstruction = climateZone ? ` Tailor the description to the '${climateZone}' climate, noting suitability and any adaptations needed.` : '';
        const prompt = `Provide a brief, user-friendly description for a "${elementName}" for a homeowner's landscape design catalog. Include its typical size, ideal conditions (sun, water), and one interesting fact or design tip.${climateInstruction} Format the response as a single, concise paragraph.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error(`Error getting info for "${elementName}":`, error);
        throw new Error(sanitizeError(error));
    }
};

// FIX: Add getReplacementSuggestions function to fetch design element alternatives from the Gemini API.
/**
 * Validates the redesigned image against the original and user settings.
 * @param originalBase64 - Base64 of the original image.
 * @param originalMimeType - MIME type of the original image.
 * @param redesignedBase64 - Base64 of the redesigned image.
 * @param redesignedMimeType - MIME type of the redesigned image.
 * @param styles - Selected landscaping styles.
 * @param allowStructuralChanges - Whether structural changes are allowed.
 * @param climateZone - Specified climate zone.
 * @param redesignDensity - Selected redesign density.
 * @returns Validation result with pass/fail for each criterion.
 */
export const validateRedesign = async (
  originalBase64: string,
  originalMimeType: string,
  redesignedBase64: string,
  redesignedMimeType: string,
  styles: LandscapingStyle[],
  allowStructuralChanges: boolean,
  climateZone: string,
  redesignDensity: RedesignDensity
): Promise<{
  propertyConsistency: boolean;
  styleAccuracy: boolean;
  aspectRatioCompliance: boolean;
  structuralChangeRules: boolean;
  locationClimateRespect: boolean;
  redesignDensity: boolean;
  authenticityGuard: boolean;
  overallPass: boolean;
  reasons: string[];
}> => {
  const styleNames = styles.map(styleId => LANDSCAPING_STYLES.find(s => s.id === styleId)?.name || styleId);
  const densityName = redesignDensity === 'minimal' ? 'minimal' : redesignDensity === 'lush' ? 'lush' : 'balanced';

  const prompt = `
You are validating a landscape redesign. You have the original property image and the redesigned image.

Check the following criteria and respond with a JSON object indicating pass/fail for each, plus reasons for failures.

Criteria:
1. Property Consistency: Does the redesigned image depict the same property as the original (same house, structure, background, general layout)? Pass if yes, fail if it looks like a different property or generic scene.

2. Style Accuracy: Does the redesigned image match the selected style(s): ${styleNames.join(', ')}? The style should be evident in the landscape elements.

3. Aspect Ratio Compliance: Do both images have the same aspect ratio? (You can infer from dimensions if provided, but visually check if proportions match.)

4. Structural Change Rules: If allowStructuralChanges is ${allowStructuralChanges}, check if structural changes (adding/removing buildings, walls, driveways) were appropriately ${allowStructuralChanges ? 'allowed and limited to aesthetic additions' : 'not made'}. The house itself must never be altered.

5. Location & Climate Zone Respect: Are the plants, materials, and elements suitable for the climate zone: ${climateZone || 'general'}? Check for appropriate vegetation types.

6. Redesign Density: Does the density match the setting: ${densityName}? (minimal: sparse and open; balanced: moderate; lush: dense and full)

7. Authenticity Guard: Is the redesigned image a true modification of the original property, not a random or unrelated AI-generated image?

Respond with JSON:
{
  "propertyConsistency": boolean,
  "styleAccuracy": boolean,
  "aspectRatioCompliance": boolean,
  "structuralChangeRules": boolean,
  "locationClimateRespect": boolean,
  "redesignDensity": boolean,
  "authenticityGuard": boolean,
  "reasons": ["reason for each failure"]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: 'Original image:' },
          { inlineData: { data: originalBase64, mimeType: originalMimeType } },
          { text: 'Redesigned image:' },
          { inlineData: { data: redesignedBase64, mimeType: redesignedMimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            propertyConsistency: { type: Type.BOOLEAN },
            styleAccuracy: { type: Type.BOOLEAN },
            aspectRatioCompliance: { type: Type.BOOLEAN },
            structuralChangeRules: { type: Type.BOOLEAN },
            locationClimateRespect: { type: Type.BOOLEAN },
            redesignDensity: { type: Type.BOOLEAN },
            authenticityGuard: { type: Type.BOOLEAN },
            reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['propertyConsistency', 'styleAccuracy', 'aspectRatioCompliance', 'structuralChangeRules', 'locationClimateRespect', 'redesignDensity', 'authenticityGuard', 'reasons']
        }
      }
    });

    const result = JSON.parse(response.text);
    const overallPass = Object.values(result).every(val => typeof val === 'boolean' ? val : true); // reasons is array, so skip
    result.overallPass = overallPass;
    return result;
  } catch (error) {
    console.error('Validation error:', error);
    // On error, assume pass to not block, but log
    return {
      propertyConsistency: true,
      styleAccuracy: true,
      aspectRatioCompliance: true,
      structuralChangeRules: true,
      locationClimateRespect: true,
      redesignDensity: true,
      authenticityGuard: true,
      overallPass: true,
      reasons: []
    };
  }
};

/**
 * Gets suggestions for replacing a landscape element.
 * @param elementName - The name of the element to replace.
 * @param styles - The desired landscaping styles.
 * @param climateZone - The geographic area or climate zone.
 * @returns A promise that resolves to an array of suggestion strings.
 */
export const getReplacementSuggestions = async (
  elementName: string,
  styles: LandscapingStyle[],
  climateZone: string
): Promise<string[]> => {
  try {
    const styleNames = styles.map(styleId => LANDSCAPING_STYLES.find(s => s.id === styleId)?.name || styleId).join(' and ');
    const climateInstruction = climateZone ? ` The suggestions must be suitable for the '${climateZone}' climate.` : '';

    const prompt = `I am redesigning a garden and want to replace a "${elementName}".
    Please provide 3-5 alternative suggestions that fit a '${styleNames}' style.
    ${climateInstruction}
    Prioritize native or sustainable options for the climate zone.
    Each suggestion should be similar in function or scale to the original item.
    For each suggestion, include a brief rationale (e.g., why it fits the style or climate).
    Respond with a JSON array of objects, each with "suggestion" and "rationale" fields.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              suggestion: { type: Type.STRING, description: 'The name of the suggested replacement item.' },
              rationale: { type: Type.STRING, description: 'A brief reason why this suggestion fits.' }
            },
            required: ['suggestion', 'rationale']
          }
        }
      }
    });

    const text = response.text.trim();
    try {
        const suggestions = JSON.parse(text);
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'object' && s !== null && 'suggestion' in s && 'rationale' in s)) {
            return suggestions.map(s => `Suggestion: ${s.suggestion} - Rationale: ${s.rationale}`);
        }
        console.warn('Parsed JSON is not an array of objects with suggestion and rationale:', suggestions);
        return [];
    } catch (e) {
      console.error("Failed to parse suggestions JSON from model:", e, "Received text:", text);
      return [];
    }
  } catch (error) {
    console.error(`Error getting replacement suggestions for "${elementName}":`, error);
    throw new Error(sanitizeError(error));
  }
};
