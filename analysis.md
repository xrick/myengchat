# Project Analysis: English Speaking Practice Application

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Frontend Components](#frontend-components)
4. [Backend API Routes](#backend-api-routes)
5. [Azure Services Integration](#azure-services-integration)
6. [Data Models and Types](#data-models-and-types)
7. [Configuration](#configuration)
8. [Dependencies](#dependencies)
9. [Development Workflow](#development-workflow)
10. [Security Implementation](#security-implementation)
11. [Error Handling and Logging](#error-handling-and-logging)
12. [Performance Optimizations](#performance-optimizations)

## Project Overview

This is a bilingual English speaking practice application that provides AI-powered assessment for two main test modes:
- **Question-answering**: Practice answering English questions with real-time feedback
- **Image description**: Practice describing images in English with comprehensive evaluation

The application features dual assessment using Azure Speech Services for pronunciation and OpenAI for content evaluation, providing scores on a 0-100 scale with detailed feedback in Traditional Chinese.

### Key Features
- Real-time speech recognition and pronunciation assessment
- AI-powered content evaluation and feedback
- Progressive score display with visual feedback
- Comprehensive session-level feedback
- Responsive UI with smooth animations
- Bilingual interface (English content, Chinese feedback)

## Architecture

### SvelteKit Architecture (Primary Implementation)

The application follows a modern full-stack architecture using SvelteKit:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   SvelteKit     │    │   External      │
│   (Svelte)      │◄──►│   API Routes    │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Components    │    │ • /api/grader   │    │ • Azure Speech  │
│ • State Mgmt    │    │ • /api/speech   │    │ • Azure OpenAI  │
│ • Azure SDK     │    │ • Server Utils  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

```
User Input → Audio Recording → Azure Speech Assessment → Content Grading → Results Display
     ↓              ↓                    ↓                    ↓              ↓
  UI State    Audio Buffer         Speech Scores        Content Scores   Visual Feedback
```

### File Structure Analysis

```
src/
├── app.css                           # Global styles with Tailwind
├── app.html                          # HTML template with SvelteKit placeholders
├── app.d.ts                          # TypeScript declarations
├── lib/
│   ├── azure/                        # Azure services client-side integration
│   │   ├── credential.ts             # JWT token management and validation
│   │   └── speech/
│   │       ├── index.ts              # Speech services main export
│   │       ├── recognizer.ts         # Speech recognition with pronunciation assessment
│   │       └── synthesizer.ts        # Text-to-speech synthesis
│   ├── components/                   # Reusable Svelte components
│   │   ├── AssessmentResult.svelte   # Results display with progressive animations
│   │   ├── AudioPlayer.svelte        # Audio playback component
│   │   ├── CircularProgress.svelte   # Circular progress indicator
│   │   ├── FinalResult.svelte        # Final assessment summary
│   │   ├── OverallFeedback.svelte    # Session-level comprehensive feedback
│   │   ├── ProgressNavigation.svelte # Navigation between questions
│   │   ├── PronunciationBreakdown.svelte # Detailed pronunciation analysis
│   │   ├── Recorder.svelte           # Main recording interface
│   │   ├── ScoreSummary.svelte       # Score visualization
│   │   └── SpeakingPractice.svelte   # Main practice interface
│   ├── grader.ts                     # Client-side API wrapper for grading
│   ├── server/                       # Server-side utilities and integrations
│   │   ├── azure/
│   │   │   ├── openai.ts             # Azure OpenAI client configuration
│   │   │   └── speech.ts             # Azure Speech Services server integration
│   │   └── utils/
│   │       ├── jailbreak.ts          # Security: prompt injection detection
│   │       └── zod.ts                # Data validation utilities
│   ├── types.ts                      # Core TypeScript type definitions
│   └── types/
│       ├── questionService.ts        # Question service type definitions
│       └── questions.ts              # Question data structures
└── routes/                           # SvelteKit routing system
    ├── +layout.svelte                # Global layout with navigation
    ├── +page.svelte                  # Landing page
    ├── api/                          # API endpoints
    │   ├── grader/
    │   │   ├── overall-feedback/
    │   │   │   └── +server.ts        # Overall feedback generation
    │   │   └── score-answer/
    │   │       └── +server.ts        # Content assessment endpoint
    │   └── speech/
    │       └── credentials/
    │           └── +server.ts        # Azure Speech credentials
    ├── image-description/
    │   └── +page.svelte              # Image description practice page
    ├── question-answering/
    │   └── +page.svelte              # Question answering practice page
    └── recorder/
        └── +page.svelte              # Recording interface page
```

## Frontend Components

### Core Components Analysis

#### 1. **SpeakingPractice.svelte** (`src/lib/components/SpeakingPractice.svelte`)

**Purpose**: Main orchestration component for the speaking practice interface

**Key Features**:
- Question management and navigation (lines 45-78)
- Recording state management with real-time feedback
- Progress tracking across multiple questions
- Final results compilation and display
- Session-level feedback generation

**State Management**:
```typescript
let currentQuestionIndex = $state(0);
let responses: Message[] = $state([]);
let showFinalResult = $state(false);
let isRecording = $state(false);
```

**Data Flow**:
1. Question display → Recording → Assessment → Results
2. Progress tracking → Next question → Final compilation

#### 2. **Recorder.svelte** (`src/lib/components/Recorder.svelte`)

**Purpose**: Core recording interface with Azure Speech Services integration

**Key Features** (lines 45-180):
- Real-time audio recording with visual feedback
- Azure Speech SDK integration for continuous recognition
- Pronunciation assessment with detailed metrics
- Volume monitoring and silence detection
- Recording state management with start/stop controls

**Azure Integration**:
```typescript
// Speech recognition setup (lines 65-95)
const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
recognizer.recognizeOnceAsync(result => {
    // Process speech recognition results
    const pronunciationAssessment = result.properties.getProperty(
        PropertyId.SpeechServiceResponse_JsonResult
    );
});
```

**Audio Processing**:
- Web Audio API for volume monitoring
- Real-time waveform visualization
- Automatic silence detection and recording stop

#### 3. **AssessmentResult.svelte** (`src/lib/components/AssessmentResult.svelte`)

**Purpose**: Progressive results display with animations

**Key Features**:
- Progressive score revelation with smooth animations
- Speech and content assessment breakdown
- Visual progress indicators
- Detailed feedback display
- Score categorization (Excellent, Good, Needs Improvement)

**Visual Elements**:
```svelte
<!-- Progressive score display (lines 25-45) -->
{#if showSpeechScore}
    <div transition:fade={{ duration: 300 }}>
        <ScoreSummary assessment={result.speechAssessment} />
    </div>
{/if}
```

#### 4. **PronunciationBreakdown.svelte** (`src/lib/components/PronunciationBreakdown.svelte`)

**Purpose**: Detailed pronunciation analysis display

**Key Features**:
- Phoneme-level pronunciation feedback
- Accuracy, fluency, and prosody breakdowns
- Word-level assessment visualization
- Interactive pronunciation details
- Error highlighting and improvement suggestions

### Layout and Navigation

#### **+layout.svelte** (`src/routes/+layout.svelte`)

**Purpose**: Global application layout with navigation

**Key Features** (lines 19-49):
- Responsive navigation bar with hamburger menu
- Active route highlighting
- Flowbite component integration
- Consistent header and footer layout
- Mobile-responsive design

**Navigation Structure**:
```svelte
<NavUl activeUrl={$page.url.pathname}>
    <NavLi href="/">首頁</NavLi>
    <NavLi href="/question-answering">回答問題</NavLi>
    <NavLi href="/image-description">看圖敘述</NavLi>
</NavUl>
```

### Page Components

#### **+page.svelte** (`src/routes/+page.svelte`)

**Purpose**: Landing page with feature showcase

**Key Features** (lines 15-174):
- Hero section with gradient branding
- Feature cards with icons and descriptions
- Practice mode selection cards
- Smooth scrolling navigation
- Responsive grid layout

**Practice Mode Cards**:
- Question-answering card with microphone icon
- Image description card with image icon
- Feature tags and descriptions
- Call-to-action buttons

#### **question-answering/+page.svelte** & **image-description/+page.svelte**

**Purpose**: Practice mode specific pages

**Key Features**:
- SpeakingPractice component integration
- Mode-specific question loading
- Progress tracking
- Results compilation

## Backend API Routes

### Content Assessment API

#### **score-answer/+server.ts** (`src/routes/api/grader/score-answer/+server.ts`)

**Purpose**: Content assessment using Azure OpenAI

**Key Features** (lines 25-80):
- Input validation with Zod schemas
- Jailbreak detection for security
- OpenAI GPT-4 integration
- Structured response parsing
- Error handling and logging

**Request Processing**:
```typescript
// Input validation (lines 30-35)
const validatedData = graderRequestSchema.parse(await request.json());

// Security check (lines 40-45)
const jailbreakResult = await detectJailbreak(validatedData.answer);
if (jailbreakResult.isJailbreak) {
    throw new Error('Jailbreak attempt detected');
}

// OpenAI assessment (lines 50-75)
const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' }
});
```

**Assessment Criteria**:
- Vocabulary usage (0-100)
- Grammar accuracy (0-100)
- Content relevance (0-100)
- Overall grade (0-5)

#### **overall-feedback/+server.ts** (`src/routes/api/grader/overall-feedback/+server.ts`)

**Purpose**: Session-level comprehensive feedback generation

**Key Features** (lines 15-60):
- Multiple response analysis
- Comprehensive feedback generation
- Performance trend analysis
- Improvement recommendations
- Traditional Chinese feedback

**Feedback Generation**:
```typescript
// Session analysis (lines 25-35)
const sessionSummary = responses.map(r => ({
    question: r.question,
    answer: r.answer,
    scores: r.result?.contentAssessment
}));

// Comprehensive feedback (lines 40-55)
const feedback = await generateOverallFeedback(sessionSummary);
```

### Speech Credentials API

#### **credentials/+server.ts** (`src/routes/api/speech/credentials/+server.ts`)

**Purpose**: Azure Speech Services token management

**Key Features** (lines 8-25):
- JWT token generation
- Token validation and refresh
- Region-specific endpoint handling
- Security token management
- CORS headers configuration

**Token Generation**:
```typescript
// Azure token request (lines 15-20)
const tokenResponse = await fetch(
    `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
    {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
);
```

## Azure Services Integration

### Azure Speech Services

#### **Speech Recognition** (`src/lib/azure/speech/recognizer.ts`)

**Purpose**: Continuous speech recognition with pronunciation assessment

**Key Features** (lines 21-120):
- Real-time speech recognition
- Pronunciation assessment with prosody
- Voice Activity Detection (VAD)
- Configurable silence timeout
- Phrase list support
- Audio volume analysis

**Recognition Configuration**:
```typescript
// Speech configuration (lines 25-35)
const speechConfig = SpeechConfig.fromAuthorizationToken(token, region);
speechConfig.speechRecognitionLanguage = 'en-US';
speechConfig.outputFormat = OutputFormat.Detailed;

// Pronunciation assessment config (lines 40-50)
const pronunciationAssessmentConfig = new PronunciationAssessmentConfig(
    referenceText,
    GradingSystem.HundredMark,
    Granularity.Phoneme,
    true // Enable prosody assessment
);
```

**Assessment Metrics**:
- Accuracy Score (0-100)
- Fluency Score (0-100)
- Prosody Score (0-100)
- Completeness Score (0-100)
- Overall Pronunciation Score (0-100)

#### **Speech Synthesis** (`src/lib/azure/speech/synthesizer.ts`)

**Purpose**: Text-to-speech synthesis

**Key Features** (lines 15-85):
- SSML support for enhanced speech
- Voice configuration
- Sentence buffering
- Interrupt capability
- Audio format configuration

**Synthesis Configuration**:
```typescript
// Synthesizer setup (lines 20-30)
const speechConfig = SpeechConfig.fromAuthorizationToken(token, region);
speechConfig.speechSynthesisVoiceName = 'en-US-AriaNeural';
speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
```

#### **Credential Management** (`src/lib/azure/credential.ts`)

**Purpose**: Client-side credential management

**Key Features** (lines 10-45):
- JWT token validation
- Automatic token refresh
- Credential caching
- Error handling and retry logic
- Token expiration detection

**Token Management**:
```typescript
// Token validation (lines 15-25)
function isTokenValid(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        return Date.now() < exp - 60000; // 1 minute buffer
    } catch {
        return false;
    }
}
```

### Azure OpenAI Integration

#### **OpenAI Client** (`src/lib/server/azure/openai.ts`)

**Purpose**: Azure OpenAI client configuration

**Key Features** (lines 15-45):
- Azure OpenAI client setup
- Environment configuration
- Model deployment management
- Error handling and logging
- Request/response formatting

**Client Configuration**:
```typescript
// Azure OpenAI setup (lines 20-30)
const openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.DEPLOYMENT}`,
    defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION }
});
```

**Content Assessment Prompts**:
- System prompt for assessment criteria
- User prompt with question and answer
- Structured JSON response format
- Traditional Chinese feedback generation

## Data Models and Types

### Core Type Definitions (`src/lib/types.ts`)

#### **Assessment Result Structure**

```typescript
// Primary assessment result (lines 15-25)
export interface AssessmentResult {
    speechAssessment: SpeechAssessment;
    contentAssessment: ContentAssessment;
    overallScore: number; // 0-100
    feedback: string;
    timestamp: Date;
}

// Speech assessment from Azure (lines 30-40)
export interface SpeechAssessment {
    accuracyScore: number;      // 0-100
    fluencyScore: number;       // 0-100
    prosodyScore: number;       // 0-100
    completenessScore: number;  // 0-100
    pronunciationScore: number; // 0-100
}

// Content assessment from OpenAI (lines 45-55)
export interface ContentAssessment {
    vocabulary: number;    // 0-100
    grammar: number;       // 0-100
    relevance: number;     // 0-100
    totalScore: number;    // 0-100
    grade: number;         // 0-5
}
```

#### **Question and Response Types**

```typescript
// Question structure (lines 60-70)
export interface Question {
    id: string;
    type: 'text' | 'image';
    difficulty: 'easy' | 'medium' | 'hard';
    content: string;
    imageUrl?: string;
    timeLimit: number; // seconds
    referenceAnswer?: string;
}

// Message structure for chat-like interface (lines 75-85)
export interface Message {
    id: string;
    question: Question;
    answer: string;
    audioBlob?: Blob;
    result?: AssessmentResult;
    timestamp: Date;
}
```

#### **API Request/Response Types**

```typescript
// Grader API request (lines 90-100)
export interface GraderRequest {
    question: string;
    answer: string;
    questionType: 'text' | 'image';
    imageUrl?: string;
    difficulty: string;
}

// Overall feedback request (lines 105-115)
export interface OverallFeedbackRequest {
    responses: Array<{
        question: string;
        answer: string;
        result?: AssessmentResult;
    }>;
    sessionSummary: {
        totalQuestions: number;
        averageScore: number;
        timeSpent: number;
    };
}
```

### Question Service Types (`src/lib/types/questionService.ts`)

#### **Question Management**

```typescript
// Question service interface (lines 10-20)
export interface QuestionService {
    getQuestions(type: 'text' | 'image', difficulty: string): Promise<Question[]>;
    getRandomQuestion(type: 'text' | 'image'): Promise<Question>;
    validateAnswer(questionId: string, answer: string): Promise<boolean>;
}

// Question metadata (lines 25-35)
export interface QuestionMetadata {
    category: string;
    tags: string[];
    expectedKeywords: string[];
    scoringCriteria: {
        vocabulary: string[];
        grammar: string[];
        content: string[];
    };
}
```

### Validation Schemas (`src/lib/server/utils/zod.ts`)

#### **Input Validation**

```typescript
// Grader request validation (lines 15-25)
export const graderRequestSchema = z.object({
    question: z.string().min(1).max(1000),
    answer: z.string().min(1).max(2000),
    questionType: z.enum(['text', 'image']),
    imageUrl: z.string().url().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard'])
});

// Assessment result validation (lines 30-40)
export const assessmentResultSchema = z.object({
    speechAssessment: z.object({
        accuracyScore: z.number().min(0).max(100),
        fluencyScore: z.number().min(0).max(100),
        prosodyScore: z.number().min(0).max(100),
        completenessScore: z.number().min(0).max(100),
        pronunciationScore: z.number().min(0).max(100)
    }),
    contentAssessment: z.object({
        vocabulary: z.number().min(0).max(100),
        grammar: z.number().min(0).max(100),
        relevance: z.number().min(0).max(100),
        totalScore: z.number().min(0).max(100),
        grade: z.number().min(0).max(5)
    }),
    overallScore: z.number().min(0).max(100),
    feedback: z.string().min(1).max(5000)
});
```

## Configuration

### Environment Variables

#### **SvelteKit Configuration**

```bash
# Azure Speech Services
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=eastus

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_openai_key
AZURE_OPENAI_API_VERSION=2023-12-01-preview
DEPLOYMENT=gpt-4

# Debug settings
DEBUG=app:*
LOG_LEVEL=info
```

### Build Configuration

#### **Vite Configuration** (`vite.config.ts`)

```typescript
// Vite setup (lines 5-7)
export default defineConfig({
    plugins: [tailwindcss(), sveltekit()]
});
```

#### **SvelteKit Configuration** (`svelte.config.js`)

```javascript
// SvelteKit adapter configuration
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter()
    }
};
```

#### **TypeScript Configuration** (`tsconfig.json`)

```json
{
    "extends": "./.svelte-kit/tsconfig.json",
    "compilerOptions": {
        "strict": true,
        "moduleResolution": "node",
        "target": "ES2020",
        "module": "ES2020",
        "lib": ["ES2020", "DOM"]
    }
}
```

### Tailwind Configuration

#### **Tailwind CSS** (`tailwind.config.js`)

```javascript
// Tailwind with Flowbite integration
module.exports = {
    content: [
        './src/**/*.{html,js,svelte,ts}',
        './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',
                secondary: '#10b981'
            }
        }
    },
    plugins: [require('flowbite/plugin')]
};
```

## Dependencies

### Production Dependencies (`package.json`)

```json
{
    "dependencies": {
        "zod": "^3.24.3"
    },
    "devDependencies": {
        "@sveltejs/kit": "^2.20.7",
        "@sveltejs/vite-plugin-svelte": "^5.0.3",
        "svelte": "^5.28.1",
        "vite": "^6.3.2",
        "typescript": "^5.8.3",
        "tailwindcss": "^4.1.4",
        "flowbite": "^3.1.2",
        "flowbite-svelte": "^0.48.6",
        "microsoft-cognitiveservices-speech-sdk": "^1.43.1",
        "openai": "^4.95.1",
        "lucide-svelte": "^0.503.0",
        "debug": "^4.4.0"
    }
}
```

### Key Dependencies Analysis

#### **Frontend Framework**
- **SvelteKit**: Full-stack framework with SSR/SSG capabilities
- **Svelte 5**: Latest version with runes system
- **Vite**: Build tool with hot reload

#### **UI Components**
- **Flowbite**: Tailwind-based component library
- **Flowbite-Svelte**: Svelte bindings for Flowbite
- **Lucide-Svelte**: Icon library

#### **Azure Integration**
- **Microsoft Cognitive Services Speech SDK**: Browser-compatible speech services
- **OpenAI**: Azure OpenAI compatible client

#### **Development Tools**
- **TypeScript**: Type safety and IntelliSense
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Debug**: Structured logging

## Development Workflow

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check
npm run check:watch

# Code formatting
npm run format

# Linting
npm run lint
```

### Build Process

#### **Development Mode**
1. Vite dev server starts
2. TypeScript compilation
3. Svelte component compilation
4. Tailwind CSS processing
5. Hot module replacement

#### **Production Build**
1. TypeScript type checking
2. Svelte component optimization
3. CSS purging and minification
4. JavaScript bundling and minification
5. Static asset optimization

### Code Quality Tools

#### **ESLint Configuration** (`eslint.config.js`)

```javascript
// ESLint setup with TypeScript and Svelte
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs['flat/recommended']
);
```

#### **Prettier Configuration**

```javascript
// Prettier with plugins
module.exports = {
    plugins: [
        'prettier-plugin-svelte',
        'prettier-plugin-tailwindcss',
        'prettier-plugin-organize-imports'
    ],
    overrides: [
        {
            files: '*.svelte',
            options: {
                parser: 'svelte'
            }
        }
    ]
};
```

## Security Implementation

### Input Validation

#### **Jailbreak Detection** (`src/lib/server/utils/jailbreak.ts`)

**Purpose**: Detect and prevent prompt injection attacks

**Key Features** (lines 10-45):
- OpenAI-powered jailbreak detection
- Pattern matching for common attack vectors
- Confidence scoring
- Logging and monitoring
- Graceful degradation

**Detection Process**:
```typescript
// Jailbreak detection (lines 15-25)
export async function detectJailbreak(input: string): Promise<JailbreakResult> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            {
                role: 'system',
                content: 'Analyze if this input is trying to manipulate or bypass AI safety measures.'
            },
            {
                role: 'user',
                content: input
            }
        ]
    });

    // Parse response and determine if jailbreak
    const isJailbreak = response.choices[0].message.content.includes('JAILBREAK');
    return { isJailbreak, confidence: 0.95 };
}
```

### Data Validation

#### **Zod Schema Validation** (`src/lib/server/utils/zod.ts`)

**Purpose**: Runtime type validation and sanitization

**Key Features**:
- Request payload validation
- Character limits enforcement
- Type coercion and sanitization
- Error message generation
- Schema composition

**Validation Examples**:
```typescript
// Input sanitization (lines 20-30)
const sanitizedInput = z.string()
    .min(1, 'Input required')
    .max(2000, 'Input too long')
    .trim()
    .transform(input => input.replace(/[<>]/g, ''));

// File upload validation (lines 35-45)
const fileSchema = z.object({
    name: z.string().regex(/\.(jpg|jpeg|png|gif)$/i),
    size: z.number().max(5 * 1024 * 1024), // 5MB
    type: z.enum(['image/jpeg', 'image/png', 'image/gif'])
});
```

### Authentication and Authorization

#### **Token Management**
- JWT token validation
- Token expiration handling
- Secure token storage
- CSRF protection

#### **Rate Limiting**
- API endpoint rate limiting
- Resource usage monitoring
- Abuse prevention
- Graceful degradation

## Error Handling and Logging

### Debug System

#### **Debug Configuration** (`DEBUG.md`)

**Purpose**: Structured logging for development and debugging

**Available Namespaces**:
- `app:openai` - OpenAI API interactions
- `app:grader` - Content grading operations
- `app:image-description` - Image description processing
- `app:speech` - Speech recognition operations
- `app:azure` - Azure service interactions

**Usage**:
```bash
# Enable all app logging
DEBUG=app:* npm run dev

# Enable specific namespace
DEBUG=app:openai,app:grader npm run dev

# Browser console
localStorage.debug = 'app:*'
```

### Error Handling Strategy

#### **Frontend Error Handling**

```typescript
// Component error boundaries (lines 25-35)
try {
    const result = await processAudio(audioBlob);
    setAssessmentResult(result);
} catch (error) {
    console.error('Audio processing failed:', error);
    setError('音頻處理失敗，請重試');
    // Fallback to text-only assessment
}
```

#### **Backend Error Handling**

```typescript
// API error handling (lines 30-40)
try {
    const assessment = await gradeContent(request);
    return json(assessment);
} catch (error) {
    console.error('Grading failed:', error);
    return json(
        { error: 'Assessment temporarily unavailable' },
        { status: 500 }
    );
}
```

### Monitoring and Observability

#### **Performance Monitoring**
- API response times
- Speech recognition accuracy
- User interaction metrics
- Error rate tracking

#### **User Experience Monitoring**
- Recording success rates
- Assessment completion rates
- User feedback collection
- Performance bottleneck identification

## Performance Optimizations

### Frontend Optimizations

#### **Component Lazy Loading**
```typescript
// Dynamic imports for heavy components
const AssessmentResult = lazy(() => import('./AssessmentResult.svelte'));
const PronunciationBreakdown = lazy(() => import('./PronunciationBreakdown.svelte'));
```

#### **Audio Processing**
- Web Audio API for efficient audio handling
- Audio buffer optimization
- Real-time processing with minimal latency
- Memory management for audio data

#### **State Management**
- Reactive state with Svelte stores
- Minimal re-renders with fine-grained reactivity
- Efficient data flow patterns
- Memory leak prevention

### Backend Optimizations

#### **API Response Optimization**
- Response compression
- Efficient JSON serialization
- Caching strategies
- Connection pooling

#### **Azure Service Optimization**
- Token caching and reuse
- Batch processing where possible
- Efficient credential management
- Regional endpoint selection

### Bundle Optimization

#### **Code Splitting**
- Route-based code splitting
- Component lazy loading
- Library chunking
- Tree shaking

#### **Asset Optimization**
- Image optimization
- Font subsetting
- CSS purging
- JavaScript minification

---

*This analysis provides a comprehensive overview of the English Speaking Practice Application architecture, implementation details, and technical specifications. Each section includes specific file paths, line numbers, and detailed explanations to facilitate understanding and maintenance of the codebase.*