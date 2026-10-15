// services/geminiService.js
// Servicio oficial para conectar la API de Gemini con AVASA IA

export const GEMINI_API_KEY = 'AQ.Ab8RN6IxFwQDVcgiaF6pfjZ9lu9QETLQH2OudO98QBeyDWVyrQ';

// Lista de modelos ordenados por prioridad y disponibilidad
const MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-pro-latest',
];

const SYSTEM_INSTRUCTION = `Eres AVASA IA, un asistente de inteligencia artificial avanzado, inteligente, amigable, claro y servicial.
Ayudas al usuario en programación, estudio, redacción, ideas y cualquier consulta que tenga.
Responde de forma estructurada, profesional y con calidez en español.`;

/**
 * Genera una respuesta de AVASA IA utilizando la API de Gemini
 * @param {Array} history - Arreglo de mensajes previos [{ username, text }]
 * @param {string} prompt - Mensaje enviado por el usuario
 * @returns {Promise<string>}
 */
export async function askAvasaAI(history = [], prompt) {
  if (!prompt || !prompt.trim()) return '';

  // Construir historial de conversación compatible con Gemini
  const contents = [];

  // Tomamos los últimos 8 mensajes previos para mantener contexto
  const recentHistory = history.slice(-8);

  for (const msg of recentHistory) {
    if (!msg.text) continue;
    const isBot = msg.username === 'AVASA IA' || msg.username === 'Gemini';
    contents.push({
      role: isBot ? 'model' : 'user',
      parts: [{ text: msg.text }],
    });
  }

  // Agregar el mensaje actual del usuario
  contents.push({
    role: 'user',
    parts: [{ text: prompt.trim() }],
  });

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500,
    },
  };

  // Intentar con los modelos disponibles con fallback automático
  let lastError = null;

  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Modelo ${model} no respondió OK:`, errorData?.error?.message || response.status);
        lastError = errorData?.error?.message || `HTTP ${response.status}`;
        continue; // Probar siguiente modelo
      }

      const data = await response.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (answer) {
        return answer.trim();
      }
    } catch (err) {
      console.warn(`Error al consultar ${model}:`, err.message);
      lastError = err.message;
    }
  }

  // Si fallan todas las llamadas a la red por límite temporal, dar respuesta de cortesía
  return (
    'Disculpa, en este momento el servicio de AVASA IA está recibiendo un alto volumen de solicitudes. ' +
    'Por favor intenta de nuevo en unos segundos.'
  );
}

