# 🩺 FUCS Exam Prep — Simulacros con IA

Aplicación de preparación para el examen de la **Fundación Universitaria de Ciencias de la Salud (FUCS)** con banco de preguntas de simulacros 2019–2024 y tutor IA integrado.

![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Claude](https://img.shields.io/badge/Claude_AI-Sonnet_4-7C3AED)

## ✨ Funcionalidades

- **🎯 Modo Simulacro** — Quiz con selección de especialidad, cantidad configurable (5-50 preguntas), puntaje en tiempo real
- **📚 Modo Estudio** — Flashcards navegables con filtro por especialidad
- **🧠 Tutor IA** — Chat integrado con Claude que conoce el contexto de cada pregunta
- **📊 Resultados** — Desglose por especialidad, revisión de incorrectas
- **1000 preguntas** cubriendo 9 especialidades: Epidemiología, Cirugía, Medicina Interna, Pediatría, Fisiología, Ginecología, Patología, Anatomía, Farmacología

---

## 🚀 Deploy en 3 pasos

### Paso 1: Subir a GitHub

```bash
# Clona o descarga este proyecto, luego:
cd fucs-exam-prep
git init
git add .
git commit -m "Initial commit: FUCS Exam Prep"

# Crear repo en GitHub (via web o CLI):
gh repo create fucs-exam-prep --public --push
# O manualmente:
git remote add origin https://github.com/TU_USUARIO/fucs-exam-prep.git
git branch -M main
git push -u origin main
```

### Paso 2: Deploy en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Click **"Add New → Project"**
3. Importa el repo `fucs-exam-prep`
4. Vercel detectará automáticamente que es Vite. Confirma los defaults:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**

### Paso 3: Configurar API Key (para el Tutor IA)

1. En el dashboard de Vercel, ve a tu proyecto → **Settings → Environment Variables**
2. Agrega:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: Tu API key de Anthropic (empieza con `sk-ant-...`)
   - **Environment**: Production, Preview, Development
3. Click **Save**
4. Ve a **Deployments** → click los 3 puntos del último deploy → **Redeploy**

> 💡 Obtén tu API key en [console.anthropic.com](https://console.anthropic.com/)

---

## 🛠️ Desarrollo local

```bash
# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env
# Edita .env y agrega tu ANTHROPIC_API_KEY

# Iniciar servidor de desarrollo
npm run dev
```

> **Nota**: Para desarrollo local, el tutor IA requiere usar `vercel dev` en lugar de `npm run dev` para que las serverless functions funcionen:
>
> ```bash
> npm i -g vercel
> vercel dev
> ```

---

## 📁 Estructura del proyecto

```
fucs-exam-prep/
├── api/
│   └── chat.js              # Serverless function (proxy Anthropic API)
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AITutor.jsx       # Chat con IA
│   │   └── Icons.jsx         # Iconos SVG
│   ├── data/
│   │   └── questions.js      # Banco de 1000 preguntas
│   ├── App.jsx               # Componente principal
│   ├── index.css             # Estilos globales
│   └── main.jsx              # Entry point
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

---

## 🔧 Personalización

### Agregar más preguntas

Edita `src/data/questions.js` y agrega objetos al array `QUESTION_BANK`:

```javascript
{
  id: 1001,                           // ID único
  specialty: "Fisiología",          // Especialidad (debe existir en SPECIALTIES)
  topic: "Cardiovascular",          // Sub-tema
  year: "2024",                     // Año del simulacro
  difficulty: "alta",               // alta | media | baja
  question: "Tu pregunta aquí...",
  options: ["Opción A", "Opción B", "Opción C", "Opción D"],
  correct: 1,                       // Índice de la respuesta correcta (0-based)
  explanation: "Explicación detallada..."
}
```

### Agregar nuevas especialidades

Si agregas una especialidad nueva, también agrega su emoji en `SPECIALTY_EMOJIS`:

```javascript
export const SPECIALTY_EMOJIS = {
  ...
  "Nueva Especialidad": "🔬",
};
```

---

## 📋 Stack tecnológico

| Componente | Tecnología |
|------------|-----------|
| Frontend | React 18 + Vite 6 |
| Estilos | CSS-in-JS (inline styles) |
| IA | Claude Sonnet 4 (Anthropic API) |
| Backend | Vercel Serverless Functions |
| Deploy | Vercel |

---

## 📄 Licencia

Proyecto educativo. Las preguntas están basadas en simulacros públicos de la FUCS 2019-2024.

> **Nota**: Las 1000 preguntas fueron extraídas automáticamente del archivo fuente. Las respuestas de las preguntas más frecuentes y de alta prioridad han sido verificadas con conocimiento médico. Se recomienda revisar respuestas en temas menos comunes y reportar correcciones editando `src/data/questions.js`.
