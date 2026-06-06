import { GoogleGenAI, Modality, Type } from '@google/genai';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LANDSCAPING_STYLE_NAMES = {
  modern: 'Modern',
  minimalist: 'Minimalist',
  rustic: 'Rustic',
  japanese: 'Japanese',
  'urban-modern': 'Urban Modern',
  'english-cottage': 'English Cottage',
  mediterranean: 'Mediterranean',
  tropical: 'Tropical',
  farmhouse: 'Farmhouse',
  coastal: 'Coastal',
  desert: 'Desert',
  bohemian: 'Bohemian',
};

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const ALLOWED_DENSITIES = new Set(['minimal', 'default', 'lush']);
const MAX_BASE64_LENGTH = 16 * 1024 * 1024;
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
const GOOGLE_CREDENTIALS_PATH = join('/tmp', 'google-application-credentials.json');

const configureGoogleCredentials = () => {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;

  const rawJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const base64Json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64;
  const credentials = rawJson || (base64Json ? Buffer.from(base64Json, 'base64').toString('utf8') : '');

  if (!credentials) return;

  if (!existsSync(GOOGLE_CREDENTIALS_PATH)) {
    JSON.parse(credentials);
    writeFileSync(GOOGLE_CREDENTIALS_PATH, credentials, { mode: 0o600 });
  }

  process.env.GOOGLE_APPLICATION_CREDENTIALS = GOOGLE_CREDENTIALS_PATH;
};

const getVertexConfig = () => {
  configureGoogleCredentials();

  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION;

  if (!project || !location) {
    throw new Error('AI service is not configured');
  }

  return { project, location };
};

const getAiClient = () => new GoogleGenAI({
  vertexai: true,
  ...getVertexConfig(),
});

const sanitizeProviderError = (error) => {
  if (error instanceof Error && /safety|blocked|rate limit/i.test(error.message)) {
    return error.message;
  }
  return 'AI service temporarily unavailable';
};

const assertString = (value, field, maxLength = 1000) => {
  if (typeof value !== 'string') {
    throw new Error(`${field} is required`);
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new Error(`${field} is invalid`);
  }
  return trimmed;
};

const assertOptionalString = (value, field, maxLength = 1000) => {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new Error(`${field} is invalid`);
  }
  return value.trim();
};

const assertBoolean = (value, field) => {
  if (typeof value !== 'boolean') {
    throw new Error(`${field} is required`);
  }
  return value;
};

const assertImage = (base64, mimeType, base64Field, mimeTypeField) => {
  const image = assertString(base64, base64Field, MAX_BASE64_LENGTH);
  const type = assertString(mimeType, mimeTypeField, 64).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(type)) {
    throw new Error(`${mimeTypeField} is unsupported`);
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(image)) {
    throw new Error(`${base64Field} is invalid`);
  }

  return { base64: image, mimeType: type };
};

const assertStyles = (value) => {
  if (!Array.isArray(value) || value.length === 0 || value.length > 4) {
    throw new Error('styles are invalid');
  }

  return value.map((style) => assertString(style, 'style', 80));
};

const assertDensity = (value) => {
  const density = assertString(value, 'redesignDensity', 20);
  if (!ALLOWED_DENSITIES.has(density)) {
    throw new Error('redesignDensity is invalid');
  }
  return density;
};

const getStylePlantGuidance = (styleId) => {
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

const getPrompt = (styles, allowStructuralChanges, climateZone, lockAspectRatio, redesignDensity) => {
  const structuralChangeInstruction = allowStructuralChanges
    ? "You are allowed to make structural changes to the LANDSCAPE. This includes adding or altering hardscapes like pergolas, decks, stone patios, retaining walls, and pathways. This permission DOES NOT apply to the house. You are STRICTLY FORBIDDEN from altering the main building's architecture, windows, doors, or roof."
    : 'ABSOLUTELY NO structural changes. You are forbidden from adding, removing, or altering buildings, walls, gates, fences, driveways, or other permanent structures. Your redesign must focus exclusively on softscapes, plants, flowers, grass, mulch, and easily movable outdoor elements.';

  const objectRemovalInstruction = allowStructuralChanges
    ? 'Completely remove objects like people, animals, or vehicles from the property and seamlessly redesign the landscape area they occupied.'
    : 'Do not remove or alter people, animals, or vehicles. Treat them as permanent objects and design around them.';

  let climateInstruction = climateZone
    ? `All plants, trees, and materials MUST be suitable for the '${climateZone}' climate/region.`
    : 'Select plants and materials that are generally appropriate for the visual context of the image.';

  if (climateZone) {
    const lowerZone = climateZone.toLowerCase();
    const lowerStyles = styles.map((style) => style.toLowerCase());
    const climateCoveredByStyle = lowerStyles.some((style) => {
      if (/arid|desert/i.test(lowerZone)) return style === 'desert';
      if (/tropical/i.test(lowerZone)) return style === 'tropical';
      if (/mediterranean/i.test(lowerZone)) return style === 'mediterranean';
      if (/coastal/i.test(lowerZone)) return style === 'coastal';
      if (/japanese|zen/i.test(lowerZone)) return style === 'japanese';
      return false;
    });

    if (!climateCoveredByStyle) {
      if (/arid|desert/i.test(lowerZone)) {
        climateInstruction += ' Prioritize drought-tolerant succulents, cacti, ornamental grasses, and hardy shrubs.';
      } else if (/tropical/i.test(lowerZone)) {
        climateInstruction += ' Use lush, humidity-loving plants like palms, hibiscus, ferns, and orchids.';
      } else if (/mediterranean/i.test(lowerZone)) {
        climateInstruction += ' Choose sun-tolerant plants like olive trees, lavender, rosemary, and citrus trees.';
      } else if (/japanese|zen/i.test(lowerZone)) {
        climateInstruction += ' Incorporate maples, bamboo, moss, and cherry trees.';
      } else if (/coastal/i.test(lowerZone)) {
        climateInstruction += ' Select salt-tolerant plants like ornamental grasses, beach roses, and hardy shrubs.';
      }
    }
  }

  const densityInstruction = {
    minimal: 'The user selected a MINIMAL design. Prioritize open space and simplicity with a limited number of high-impact plants and features.',
    default: 'The user selected a BALANCED design. Create a harmonious mix of planted areas and functional open space.',
    lush: 'The user selected a LUSH design. Maximize layered planting and rich foliage while preserving functional access.',
  }[redesignDensity];

  const styleNames = styles.map((styleId) => LANDSCAPING_STYLE_NAMES[styleId] || styleId);
  const stylePlantGuidance = styles
    .map((style) => getStylePlantGuidance(style))
    .filter((guidance) => guidance !== 'plants appropriate to the selected style')
    .join(', ');
  const styleInstruction = styleNames.length > 1
    ? `Redesign the landscape in a blended style that combines '${styleNames.join("' and '")}'.${stylePlantGuidance ? ` Incorporate plants like ${stylePlantGuidance}.` : ''}`
    : `Redesign the landscape in a '${styleNames[0]}' style. Incorporate ${getStylePlantGuidance(styles[0])}.`;

  return `
You are an expert AI landscape designer. Perform an in-place edit of the user's image to redesign the landscape while preserving the property.

Core rules:
- Preserve the property. Modify only the landscape, plants, paths, and furniture. Do not replace the property or alter the house.
- Keep garages, driveways, front doors, side doors, and patio doors accessible with clear unobstructed paths.
- Object handling: ${objectRemovalInstruction}
- Structural changes: ${structuralChangeInstruction}

Output requirements:
- Response must start with the redesigned image.
- Provide only a valid JSON object after the image describing plants and features.

Redesign instructions:
- Style: ${styleInstruction}
- Climate: ${climateInstruction}
- Density: ${densityInstruction}
- Aspect ratio: ${lockAspectRatio ? 'Maintain the exact aspect ratio of the original input image.' : 'Preserve the original aspect ratio if possible.'}
- Quality: Ultra-photorealistic, high-resolution, sharp focus, matching original lighting. No labels, text, or watermarks.

JSON schema:
{
  "plants": [{ "name": "string", "species": "string" }],
  "features": [{ "name": "string", "description": "string" }]
}
`;
};

const parseDesignCatalog = (text) => {
  try {
    let jsonStringToParse = text;
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch?.[1]) {
      jsonStringToParse = markdownMatch[1];
    } else {
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');
      if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex <= jsonStartIndex) {
        return null;
      }
      jsonStringToParse = text.substring(jsonStartIndex, jsonEndIndex + 1);
    }
    return JSON.parse(jsonStringToParse);
  } catch {
    return null;
  }
};

const redesignOutdoorSpace = async (payload) => {
  const { base64, mimeType } = assertImage(payload.base64Image, payload.mimeType, 'base64Image', 'mimeType');
  const styles = assertStyles(payload.styles);
  const allowStructuralChanges = assertBoolean(payload.allowStructuralChanges, 'allowStructuralChanges');
  const lockAspectRatio = assertBoolean(payload.lockAspectRatio, 'lockAspectRatio');
  const climateZone = assertOptionalString(payload.climateZone, 'climateZone', 120);
  const redesignDensity = assertDensity(payload.redesignDensity);

  const response = await getAiClient().models.generateContent({
    model: GEMINI_IMAGE_MODEL,
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: getPrompt(styles, allowStructuralChanges, climateZone, lockAspectRatio, redesignDensity) },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  if (response.promptFeedback?.blockReason) {
    throw new Error(`Request blocked by AI safety filters: ${response.promptFeedback.blockReason}`);
  }

  if (!response.candidates?.length) {
    throw new Error('The model returned no content');
  }

  let redesignedImage = null;
  let accumulatedText = '';

  for (const part of response.candidates[0].content?.parts || []) {
    if (part.inlineData && !redesignedImage) {
      redesignedImage = {
        base64ImageBytes: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      };
    } else if (part.text) {
      accumulatedText += part.text;
    }
  }

  if (!redesignedImage) {
    throw new Error('The model did not return a redesigned image');
  }

  return {
    ...redesignedImage,
    catalog: parseDesignCatalog(accumulatedText) || { plants: [], features: [] },
  };
};

const getElementImage = async (payload) => {
  const elementName = assertString(payload.elementName, 'elementName', 120);
  const description = assertOptionalString(payload.description, 'description', 500);
  const prompt = description
    ? `Photorealistic image of a single "${elementName}" (${description}), isolated on a plain white background. No text, watermarks, or other objects.`
    : `Photorealistic image of a single "${elementName}" isolated on a plain white background. No text, watermarks, or other objects.`;

  const response = await getAiClient().models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: '1:1',
    },
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) {
    throw new Error('Image generation failed to return an image');
  }

  return { imageUrl: `data:image/png;base64,${imageBytes}` };
};

const getElementInfo = async (payload) => {
  const elementName = assertString(payload.elementName, 'elementName', 120);
  const climateZone = assertOptionalString(payload.climateZone, 'climateZone', 120);
  const climateInstruction = climateZone
    ? ` Tailor the description to the '${climateZone}' climate, noting suitability and any adaptations needed.`
    : '';

  const response = await getAiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Provide a brief, user-friendly description for a "${elementName}" for a homeowner's landscape design catalog. Include its typical size, ideal conditions, and one design tip.${climateInstruction} Format as one concise paragraph.`,
  });

  return { text: response.text || '' };
};

const getReplacementSuggestions = async (payload) => {
  const itemName = assertString(payload.itemName, 'itemName', 120);
  const styles = assertStyles(payload.styles);
  const climateZone = assertOptionalString(payload.climateZone, 'climateZone', 120);
  const styleNames = styles.map((styleId) => LANDSCAPING_STYLE_NAMES[styleId] || styleId);

  const response = await getAiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Suggest 5 concise replacement landscape elements for "${itemName}" in a ${styleNames.join(', ')} landscape design.${climateZone ? ` Climate/region: ${climateZone}.` : ''} Return practical homeowner-friendly names only.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['suggestions'],
      },
    },
  });

  const result = JSON.parse(response.text || '{}');
  const suggestions = Array.isArray(result.suggestions)
    ? result.suggestions
        .filter((suggestion) => typeof suggestion === 'string')
        .map((suggestion) => suggestion.trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return { suggestions };
};

const validateRedesign = async (payload) => {
  const original = assertImage(payload.originalBase64, payload.originalMimeType, 'originalBase64', 'originalMimeType');
  const redesigned = assertImage(payload.redesignedBase64, payload.redesignedMimeType, 'redesignedBase64', 'redesignedMimeType');
  const styles = assertStyles(payload.styles);
  const allowStructuralChanges = assertBoolean(payload.allowStructuralChanges, 'allowStructuralChanges');
  const climateZone = assertOptionalString(payload.climateZone, 'climateZone', 120);
  const redesignDensity = assertDensity(payload.redesignDensity);
  const styleNames = styles.map((styleId) => LANDSCAPING_STYLE_NAMES[styleId] || styleId);

  const response = await getAiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: 'Original image:' },
        { inlineData: { data: original.base64, mimeType: original.mimeType } },
        { text: 'Redesigned image:' },
        { inlineData: { data: redesigned.base64, mimeType: redesigned.mimeType } },
        {
          text: `Validate whether this landscape redesign preserves the original property, matches styles ${styleNames.join(', ')}, follows structural rules with allowStructuralChanges=${allowStructuralChanges}, respects climate ${climateZone || 'general'}, matches density ${redesignDensity}, and is a true modification of the original. Respond only with the requested JSON.`,
        },
      ],
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
          reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          'propertyConsistency',
          'styleAccuracy',
          'aspectRatioCompliance',
          'structuralChangeRules',
          'locationClimateRespect',
          'redesignDensity',
          'authenticityGuard',
          'reasons',
        ],
      },
    },
  });

  const result = JSON.parse(response.text || '{}');
  const overallPass = [
    result.propertyConsistency,
    result.styleAccuracy,
    result.aspectRatioCompliance,
    result.structuralChangeRules,
    result.locationClimateRespect,
    result.redesignDensity,
    result.authenticityGuard,
  ].every(Boolean);

  return {
    propertyConsistency: Boolean(result.propertyConsistency),
    styleAccuracy: Boolean(result.styleAccuracy),
    aspectRatioCompliance: Boolean(result.aspectRatioCompliance),
    structuralChangeRules: Boolean(result.structuralChangeRules),
    locationClimateRespect: Boolean(result.locationClimateRespect),
    redesignDensity: Boolean(result.redesignDensity),
    authenticityGuard: Boolean(result.authenticityGuard),
    overallPass,
    reasons: Array.isArray(result.reasons) ? result.reasons : [],
  };
};

const actions = {
  redesignOutdoorSpace,
  getElementImage,
  getElementInfo,
  getReplacementSuggestions,
  validateRedesign,
};

export const runGeminiAction = async (body) => {
  if (!body || typeof body !== 'object' || typeof body.action !== 'string') {
    throw new Error('Invalid request body');
  }

  const action = actions[body.action];
  if (!action) {
    throw new Error('Unknown AI action');
  }

  return action(body.payload || {});
};

export const handleGeminiRequest = async (body) => {
  try {
    return {
      status: 200,
      body: await runGeminiAction(body),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI service temporarily unavailable';
    const status = /required|invalid|unsupported|unknown/i.test(message) ? 400 : 500;

    if (status === 500) {
      console.error('Gemini API error:', error);
    }

    return {
      status,
      body: {
        error: status === 400 ? message : sanitizeProviderError(error),
      },
    };
  }
};
