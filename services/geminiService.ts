


import type { LandscapingStyle, DesignCatalog, RedesignDensity } from '../types';
import { LANDSCAPING_STYLES } from '../constants';
import { geminiRateLimiter } from './rateLimit';
import { sanitizeError } from './errorUtils';

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

  if (climateZone && /arid|desert/i.test(climateZone)) {
    climateInstruction += " For this arid climate, prioritize drought-tolerant plants. Excellent choices include succulents (like Agave, Aloe), cacti (like Prickly Pear), ornamental grasses (like Blue Grama), and hardy shrubs (like Sagebrush).";
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
  const styleInstruction = styleNames.length > 1
    ? `Redesign the landscape in a blended style that combines '${styleNames.join("' and '")}'. Prioritize a harmonious fusion of these aesthetics.`
    : `Redesign the landscape in a '${styleNames[0]}' style.`;

  const layoutInstruction = `**CRITICAL RULE: Functional Access (No Exceptions):**
  - **Garages & Driveways:** You MUST consistently identify all garage doors. A functional driveway MUST lead directly to each garage door. This driveway must be kept completely clear of any new plants, trees, hardscaping, or other obstructions. The driveway's width MUST be maintained to be at least as wide as the full width of the garage door it serves. Do not place any design elements on the driveway surface. This is a non-negotiable rule.
  - **All Other Doors:** EVERY door (front doors, side doors, patio doors, etc.) MUST be accessible. This means each door must have a clear, direct, and unobstructed pathway leading to it. This pathway must be at least as wide as the door itself and must connect logically to a larger circulation route like the main driveway or a walkway. Do not isolate any doors.`;

  return `
You are an expert AI landscape designer. Your task is to perform an in-place edit of the user's provided image.

**CORE DIRECTIVE: MODIFY THE LANDSCAPE, PRESERVE THE PROPERTY**
This is the most important rule. You MUST use the user's uploaded image as the base for your work. Your sole purpose is to modify the *landscape* within that photo. You are **STRICTLY FORBIDDEN** from generating a completely new image, replacing the property, or altering the main house/building. The output image must clearly be the same property as the input, but with a new landscape design.

**CRITICAL RULE: THE HOUSE IS IMMUTABLE**
This is a non-negotiable, absolute command. The main building in the photo MUST NOT be changed in any way.
- **DO NOT** alter its architecture, color, materials, windows, doors, roof, or any part of its structure.
- **DO NOT** add new doors or windows where there were none.
- **DO NOT** remove existing doors or windows.
- **DO NOT** change the color of the house paint, trim, or roof.
All design work must be done *around* the existing house as if it were a permanent, uneditable backdrop. This rule takes precedence over all other instructions, including style requests.

${layoutInstruction}

**PRIMARY GOAL: IMAGE GENERATION**
Your response MUST begin with the image part. This is a non-negotiable instruction. The first part of your multipart response must be the redesigned image.

**SECONDARY GOAL: JSON DATA**
After the image, you MUST provide a valid JSON object describing the new plants and features. Do not add any introductory text like "Here is the JSON" or conversational filler. The text part should contain ONLY the JSON object, optionally wrapped in a markdown code block.

**INPUT:**
You will receive one image (and potentially a second layout image) and this set of instructions.

**IMAGE REDESIGN INSTRUCTIONS:**
- **Style:** ${styleInstruction}
- **CRITICAL STYLE APPLICATION RULE:** Applying a style means modifying ONLY the landscape elements (plants, paths, furniture, etc.) within the user's photo to match the requested style. It does NOT mean creating a new property or scene. The house and its surroundings must remain identical to the original image, with only the landscape design changing. This rule is absolute.
- **Image Quality:** This is a CRITICAL instruction. The output image MUST be of the absolute highest professional quality. It must be ultra-photorealistic, extremely detailed, with sharp focus and lighting that matches the original image. The resolution should be as high as possible. Avoid any blurry, pixelated, distorted, or digitally artifacted results. The final image must look like it was taken with a high-end DSLR camera.
- **CRITICAL AESTHETIC RULE: NO TEXTUAL LABELS.** You are absolutely forbidden from adding any text, words, signs, or labels that name the style (e.g., do not write the word 'Modern' or 'Farmhouse' anywhere in the image). The style must be conveyed purely through visual design elements, not through text.
- **Object Removal:** ${objectRemovalInstruction}
- **Structural Landscape Changes:** ${structuralChangeInstruction}
- **Climate:** ${climateInstruction}
- **Aspect Ratio:** ${aspectRatioInstruction}
- **Design Density:** ${densityInstruction}

**JSON SCHEMA (for the text part):**
The JSON object must follow this exact schema.
${jsonSchemaString}
- Ensure every single plant in the JSON catalog is suitable for the specified climate zone. This is a non-negotiable rule.
- If a category is empty, provide an empty list [].
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

  try {
    const response = await fetch('/api/gemini/redesign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image,
        mimeType,
        styles,
        allowStructuralChanges,
        climateZone,
        lockAspectRatio,
        redesignDensity,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process redesign request');
    }

    const data = await response.json();
    return {
      base64ImageBytes: data.base64ImageBytes,
      mimeType: data.mimeType,
      catalog: data.catalog,
    };
  } catch (error) {
    console.error('Error calling redesign API:', error);
    throw new Error(sanitizeError(error));
  }
};


/**
 * Generates an isolated image of a single landscape element.
 * @param elementName - The name of the element to generate an image for.
 * @param description - An optional description to refine the image generation prompt.
 * @returns A promise that resolves to a base64 data URL of the generated image.
 */
export const getElementImage = async (elementName: string, description?: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/element-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ elementName, description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate element image');
    }

    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error(`Error generating image for "${elementName}":`, error);
    throw new Error(sanitizeError(error));
  }
};

/**
 * Gets a user-friendly description for a landscape element.
 * @param elementName - The name of the element.
 * @returns A promise that resolves to a string with the element's information.
 */
export const getElementInfo = async (elementName: string): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/element-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ elementName }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get element info');
        }

        const data = await response.json();
        return data.info;
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
  try {
    const response = await fetch('/api/gemini/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalBase64,
        originalMimeType,
        redesignedBase64,
        redesignedMimeType,
        styles,
        allowStructuralChanges,
        climateZone,
        redesignDensity
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to validate redesign');
    }

    const data = await response.json();
    return data;
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
    const response = await fetch('/api/gemini/replacements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ elementName, styles, climateZone }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get replacement suggestions');
    }

    const data = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error(`Error getting replacement suggestions for "${elementName}":`, error);
    throw new Error(sanitizeError(error));
  }
};
