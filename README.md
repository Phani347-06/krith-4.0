# 🧠 Campus Cortex AI (Krith 4.0)

**Live Demo:** [https://krith-4-0.vercel.app/](https://krith-4-0.vercel.app/)

Welcome to **Campus Cortex AI**, a next-generation, adaptive learning platform powered by Reinforcement Learning (RL) and Large Language Models (LLMs). The platform re-imagines education as an interactive, gamified "Neural Map" where every student's curriculum dynamically adapts to their strengths and weaknesses in real-time.

---

## ✨ Key Features

* **🗺️ The Neural Map Curriculum**  
  A stunning, interactive progression map built with Framer Motion. Students navigate through connected curriculum nodes (Variables, Loops, Recursion, SQL, etc.), earning XP and leveling up.
* **🤖 Krith - The AI Companion**  
  Powered by `llama-3.3-70b-versatile` (via Groq), Krith acts as a personal tutor. It doesn't just answer questions—it analyzes student sentiment and triggers deep Reinforcement Learning cycles.
* **⚙️ Adaptive Reinforcement Learning (RL) Engine**  
  The backend dynamically monitors mastery scores. If a student struggles on a quiz or asks the Chatbot for help on a specific topic, the RL Engine automatically injects **Remediation Nodes** or **Revision Quests** directly onto their Neural Map to recalibrate their understanding.
* **🛡️ Guardian Portal (Compliance & Analytics)**  
  A dedicated portal for parents and educators to track student performance, XP gains, level progression, and precise compliance metrics (Attendance & Grade %).
* **🔐 Secure Authentication & Onboarding**  
  A beautiful, multi-step onboarding flow with OTP email verification powered by Resend.

---

## 🛠️ Tech Stack

### Frontend (Client)
* **Framework:** React + Vite
* **Styling:** Tailwind CSS
* **Animations:** Framer Motion
* **Visuals:** Canvas Confetti

### Backend (API)
* **Framework:** Python + FastAPI
* **Database:** Supabase (PostgreSQL)
* **LLM Engine:** Groq (Llama-3.3-70b)
* **Email Service:** Resend API

---

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/Phani347-06/krith-4.0.git
cd cortexAI
```

### 2. Setup the Backend
Navigate to the backend directory and install the dependencies:
```bash
cd backend
pip install -r requirements.txt
```
Create a `.env` file in the `backend` folder and add your keys:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
XAI_API_KEY=your_groq_api_key
RESEND_API_KEY=your_resend_api_key
```
Start the FastAPI server:
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Setup the Frontend
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```

The platform will now be running at `http://localhost:5173`.

---

## 📝 License

Designed and developed by the Cortex AI Team. All rights reserved.
