# FUCS Exam Prep — Contexto del Proyecto

## Resumen
Plataforma de preparación para el examen médico FUCS (Fundación Universitaria de Ciencias de la Salud), Colombia. Banco de 1000 preguntas extraídas de simulacros 2019-2024 con tutor IA integrado.

## Stack
- **Frontend**: React 18 + Vite 6
- **Backend**: Vercel Serverless Functions (Node 20)
- **IA**: Claude Sonnet 4.6 (`claude-sonnet-4-6`) vía Anthropic API
- **Deploy**: Vercel (auto-deploy desde GitHub)
- **Repo**: github.com/Ddropero/fucs-exam-prep

## Estructura
```
fucs-exam-prep/
├── api/
│   ├── chat.js          # Serverless proxy → Anthropic API
│   └── health.js        # Diagnóstico de API key
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AITutor.jsx  # Chat con Claude (tutor médico)
│   │   └── Icons.jsx    # Iconos SVG
│   ├── data/
│   │   └── questions.js # 1000 preguntas MCQ
│   ├── App.jsx          # Componente principal (4 pantallas)
│   ├── index.css        # Estilos globales
│   └── main.jsx         # Entry point
├── .env.example
├── .gitignore
├── CLAUDE.md            # Este archivo
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

## Modos de la App
1. **Home** — Selección de especialidad, tamaño de quiz (5/10/20/50/100)
2. **Quiz (Simulacro)** — Preguntas MCQ con puntaje en tiempo real, barra de progreso
3. **Resultados** — Score total, desglose por especialidad, revisión de incorrectas
4. **Estudio (Flashcards)** — Navegación por flashcards con filtro por especialidad

## Banco de Preguntas (src/data/questions.js)
- **1000 preguntas** parseadas de FUCS_2019-2024_.pdf (8475 líneas)
- 9 especialidades: Cirugía(207), Epidemiología(226), Medicina Interna(131), Fisiología(94), Pediatría(97), Ginecología(76), Patología(70), Anatomía(51), Farmacología(48)
- Formato: `{ id, specialty, topic, question, options[], correct (0-based index), explanation, year, difficulty }`
- Respuestas de preguntas de alta frecuencia fueron verificadas manualmente
- ~885 preguntas tienen respuesta correct=0 por defecto y necesitan revisión

## API (Tutor IA)
- Frontend llama a `/api/chat` (POST)
- Serverless function hace proxy a `https://api.anthropic.com/v1/messages`
- API key se configura como env var `ANTHROPIC_API_KEY` en Vercel
- Todos los errores se retornan como HTTP 200 con campo `reply` (para que el frontend siempre muestre algo)
- `/api/health` retorna estado de la API key

## Diseño
- Tema oscuro: fondo `#08061a`, texto `#e8e0f0`
- Acentos: gradiente púrpura `#7c3aed → #6366f1`
- Fonts: DM Sans (texto), Space Mono (números)
- Colores de estado: verde `#4ade80` (correcto), rojo `#f87171` (incorrecto), amarillo `#fbbf24` (regular)

## Problemas Conocidos
1. **Respuestas por defecto**: ~885 preguntas tienen `correct: 0` porque no se pudo determinar automáticamente la respuesta correcta. Necesitan revisión médica manual.
2. **Clasificación "General"**: Algunas preguntas terminaron reclasificadas a "Epidemiología" o "Medicina Interna" como fallback. Podrían estar mal clasificadas.
3. **Tutor IA**: Requiere API key de Anthropic configurada en Vercel. Sin ella, el chat muestra error descriptivo.

## Comandos
```bash
npm install          # Instalar dependencias
npm run dev          # Dev server (sin API)
vercel dev           # Dev server CON serverless functions
npm run build        # Build de producción
```

## Variables de Entorno
```
ANTHROPIC_API_KEY=sk-ant-...   # Requerida para Tutor IA
```

## Para Agregar Preguntas
Editar `src/data/questions.js`, agregar al array QUESTION_BANK:
```js
{
  id: 1001,
  specialty: "Fisiología",  // Debe existir en SPECIALTIES
  topic: "Cardiovascular",
  year: "2024",
  difficulty: "alta",       // alta | media | baja
  question: "Pregunta...",
  options: ["A", "B", "C", "D"],
  correct: 2,               // Índice 0-based
  explanation: "Explicación..."
}
```

## Fuentes de Datos
- `FUCS_2019-2024_.pdf` — Archivo fuente (en realidad es .txt con extensión .pdf, 8475 líneas)
- `analisis_patrones_fucs.md` — Análisis de patrones y preguntas de alta frecuencia
