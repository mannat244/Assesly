# Project Report: Assessly (Resume2Interview)

## 1. Architecture Overview
Assessly is a modern, AI-powered interview practice platform built on a scalable and modular architecture using Next.js 16. It leverages a hybrid rendering approach (Server Components + Client Components) and a serverless-ready API structure.

### Core Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: JavaScript (ES6+)
- **Database**: MongoDB (via Mongoose 9.1.2) for user data, history, and preferences.
- **Authentication**: Custom session-based auth using `iron-session` (Encrypted cookies) + `bcryptjs` for password hashing.
- **Styling**: TailwindCSS v4 with `shadcn/ui` components (Radix UI primitives).
- **Icons**: Lucide React.
- **State Management**: React Context (`AuthContext`) + Local Component State.

### AI & External Services Stack
- **LLM**: Groq SDK using `openai/gpt-oss-120b` for chat and `llama-3.3-70b-versatile` for feedback generation. Chosen for high-throughput low-latency inference.
- **TTS (Text-to-Speech) Tiered System**:
  - **Cartesia** (Default): `sonic-3` / `sonic-english` model (Experimental high-speed TTS).
  - **Deepgram** (Economy): `aura-2-aurora-en` model via REST API.
  - **ElevenLabs** (Premium): `eleven_flash_v2_5` model via `elevenlabs-js`.
- **STT (Speech-to-Text)**: Browser native `Web Speech API` (optimized for `en-IN` English India), with `SpeechRecognition` interface.

---

## 2. API Architecture
The application exposes several RESTful API endpoints via Next.js Route Handlers. All user-data endpoints are protected via `iron-session` middleware logic.

### **Core AI Endpoints**
| Endpoint | Method | Purpose | Implementation Details |
|----------|--------|---------|------------------------|
| `/api/chat` | POST | Conversational AI | streams response from Groq (`gpt-oss-120b`). Receives full message history, returns text stream. |
| `/api/feedback` | POST | Post-Interview Analysis | Uses `llama-3.3-70b-versatile` ensuring JSON format. Analyzes transcript based on context (Company/Role) and returns Score/Strengths/Weaknesses. |

### **TTS Endpoints (Audio Generation)**
| Endpoint | Method | Provider | Key Params |
|----------|--------|----------|------------|
| `/api/cartesia` | POST | Cartesia | Uses `sonic-english`, voice ID `95d51f79...`. Returns raw WAV buffer. |
| `/api/speak` | POST | Deepgram | Uses `aura-2-aurora-en`. Lower latency/cost fallback. |
| `/api/tts` | POST | ElevenLabs | Uses `eleven_flash_v2_5`. Higher quality, premium tier. |

### **User & Data Endpoints**
| Endpoint | Method | Purpose | Implementation Details |
|----------|--------|---------|------------------------|
| `/api/user/sync` | GET/POST | Hybrid Sync | **GET**: Fetches User Profile, Resume, Interview History. **POST**: Updates partial fields (Resume, Preferences, History). |
| `/api/auth/login` | POST | Auth | Validates credentials, sets encrypted session cookie. |
| `/api/auth/signup`| POST | Auth | Creates User doc, hashes password. |
| `/api/auth/me` | GET | Auth | Validates session, returns user context. |
| `/api/auth/logout`| POST | Auth | Destroys session. |

---

## 3. Use Cases & Key Features

### **1. AI-Driven Interview Simulation**
- **Real-time Interaction**: Users speak via microphone; AI listens and responds verbally.
- **Visual Avatar**: A "Listening/Speaking" video loop creates a feeling of presence.
- **Context Awareness**: The AI takes on a persona (e.g., "Sneha") based on the User's Target Company and Job Description.
- **Turn-taking Logic**: `SpeechRecognition` events trigger "end of turn", sending transcript to `/api/chat`, receiving streamed text, which is then fed to the active TTS provider.

### **2. Live Coding Mode**
- **Integrated Editor**: A togglable code editor (Monaco-based) allows users to write code during the interview.
- **Submission**: Users can "Submit Code", which sends the code block to the AI contexts for review.
- **Mobile Responsive**: Sidebar layout for desktop, stacked for mobile.

### **3. Comprehensive Feedback System**
- **Automated Grading**: After an interview, the system generates a 0-100 score.
- **Structure**: Provides specific "Strengths" and "Areas for Improvement".
- **History Tracking**: All sessions are saved to MongoDB, viewable in the dashboard.

### **4. Personalized Dashboard**
- **Resume Editor**: Users can paste/edit their resume text, which informs the AI's questions.
- **Job Description Selector**: Choose from templates (Google, Microsoft) or paste a custom JD.
- **Stats**: Visualizes "Total Interviews", "Average Score", and recent activity.

---

## 4. Technical Choices & Trade-offs

### **1. Groq vs. OpenAI**
- **Choice**: Groq.
- **Reason**: **Extreme Low Latency**. For a voice-to-voice application, the delay between user finishing speaking and audio starting is critical. Groq provides near-instant tokens.
  
### **2. Client-Side STT vs. Server-Side STT**
- **Choice**: Web Speech API (Client-side).
- **Trade-off**:
  - *Pros*: Zero latency (processing happens on device), Zero cost, Privacy (audio doesn't leave device, only text).
  - *Cons*: Browser dependent (works best in Chrome), less accurate than Whisper/Deepgram Nova-2 in noisy environments.

### **3. Hybrid Audio Provider Strategy**
- **Choice**: User-selectable provider (Cartesia/Deepgram/ElevenLabs).
- **Reason**: Balances **Quality vs. Latency vs. Cost**.
  - *Cartesia*: Fastest experimental models.
  - *Deepgram*: Proven speed/cost ratio.
  - *ElevenLabs*: Highest quality, naturally human-sounding (but often slower/expensive).

### **4. MongoDB & Iron Session**
- **Choice**: Schema-less/Flexible Document Store + Stateless Session.
- **Reason**: Allows easy schema evolution (adding fields like `interviewHistory` or `preferences` without rigid migrations). Iron Session avoids managing a separate session store (Redis) by keeping session state client-side but encrypted.

---

## 5. Metrics & Performance Targets
*(Estimated based on architecture)*

- **Voice Response Latency**: Target < 1000ms.
  - *Breakdown*:
    - STT Finalize: ~100-300ms
    - LLM TTFT (Time to First Token): ~200ms (Groq)
    - TTS Generation: ~300ms (Cartesia/Deepgram)
- **Scalability**: Stateless API routes scale horizontally on Vercel/Serverless. MongoDB handles concurrent user data.
- **Reliability**: Fallback mechanisms (TTS retries) and graceful degradation (Web Speech fallback if API fails).
