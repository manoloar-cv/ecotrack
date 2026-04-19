import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function identifyWaste(base64Image: string) {
  // Mock fallback for demo if API key is missing or for testing
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    console.warn("Using mock waste identification (no API key configured)");
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mocks = [
      { item: "Botella de Plástico", container: "AMARILLO", confidence: 0.98, description: "Envase ligero de PET. Debe ir al contenedor amarillo.", points: 0.1, savings: 0.01 },
      { item: "Caja de Cartón", container: "AZUL", confidence: 0.95, description: "Papel y cartón limpio. Debe ir al contenedor azul.", points: 0.1, savings: 0.01 },
      { item: "Bote de Vidrio", container: "VERDE", confidence: 0.99, description: "Vidrio sin tapa. Debe ir al iglú verde.", points: 0.1, savings: 0.01 },
      { item: "Restos de Manzana", container: "MARRÓN", confidence: 0.92, description: "Materia orgánica compostable. Debe ir al contenedor marrón.", points: 0.1, savings: 0.01 },
    ];
    return mocks[Math.floor(Math.random() * mocks.length)];
  }

  try {
    const model = "gemini-3-flash-preview";
    const prompt = `Actúa como un experto en gestión de residuos y reconocimiento de objetos de alta precisión. 
    Analiza la imagen adjunta y determina exactamente qué objeto es y en qué contenedor específico del sistema de Vigo (España) debe depositarse.
    
    CRITERIOS DE CLASIFICACIÓN EN VIGO:
    - AMARILLO: Envases de plástico (botellas, tarrinas, bolsas), latas (refrescos, conservas) y briks (leche, zumo).
    - AZUL: Papel y cartón (cajas, periódicos, revistas, folletos). SIN restos de comida.
    - VERDE (Iglú): Solo VIDRIO (botellas, frascos, tarros). SIN tapas ni tapones.
    - MARRÓN: Residuos orgánicos (restos de comida, peladuras, café, infusiones, papel de cocina sucio).
    - GRIS: Resto/No reciclable (pañales, compresas, colillas, polvo de barrer, cerámica, cristales rotos que no sean envases).

    Responde estrictamente en formato JSON con esta estructura:
    {
      "item": "Nombre específico del objeto detectado",
      "container": "AMARILLO" | "AZUL" | "VERDE" | "MARRÓN" | "GRIS",
      "confidence": 0.0 a 1.0,
      "description": "Explicación técnica de por qué va en ese contenedor según las normas de Vigo",
      "points": 0.1,
      "savings": 0.01
    }
    
    Si no estás seguro, elige el contenedor más probable pero refleja una confianza baja.`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(",")[1],
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error identifying waste:", error);
    throw error;
  }
}
