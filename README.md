# PokeAPI — Generate ’em all!

Build and share your own Pokémon creations :)

The app lets users design entirely new Pokémon by mixing and matching different animal types and abilities, using real-time AI image generation through an external API.

---

## Features:

-  **AI-Powered Image Generation** using a REST API (Stable Diffusion / Pollination.IA)
-  **User Authentication** implemented via **OAuth2**
-  **Mobile-First Design**, fully responsive and optimized for mobile users  
-  Built following **WCAG 2.1 Level AA** guidelines:
    - Proper semantic HTML and ARIA labels
    - Keyboard navigability
    - Color contrast compliance 
-  **SPA Navigation** that supports browser back/forward buttons without full reloads  
-  **Dockerized Environment** using **Docker** and **Docker Compose**.  

---

## Tech Stack:

| Layer | Technology |
|:------|:------------|
| Frontend | Vue + TypeScript + Vite |
| Styling | TailwindCSS |
| API | Stable Diffusion / Pollination.IA |
| Auth | OAuth2 |
| Infrastructure | Docker & Docker Compose |
| Accessibility | WCAG 2.1 AA compliance |
| API Testing | Insomnia / Postman |

---

## Getting started

### 1️⃣ Clone the repository
```bash
git clone https://github.com/yourusername/PokeAPI.git
cd PokeAPI
```

### 2️⃣ Configure environment variables
Create a `.env` file in the repository root (optional but recommended for the backend) and set your AI provider values:

```ini
SD_API_URL=
SD_API_KEY=
```

### 3️⃣ Start both services with Docker Compose:

```bash
docker-compose up --build
```

Open http://localhost:5173 — the frontend will call the backend at http://localhost:3000.

---

## Run locally without Docker

- Frontend
    - cd frontend
    - npm install
    - npm run dev

- Backend
    - cd backend
    - npm install
    - cp .env.example .env
    - fill `.env` with `SD_API_URL` and optional `SD_API_KEY`
    - npm run dev

---

## How It Works:

1. **Login** with your OAuth2 account  
2. **Choose** from a list of animal types and abilities  
3. **Generate** a unique Pokémon using the AI image API  
4. **Share** your Pokémon as an image or link with your friends  

---

## Bonus Ideas (might add later):

- Share Pokémon via unique URLs or email  
- Allow free-text prompts for custom creations  
- Support user-uploaded images as input 
- Add multilingual support (i18n)  
- Train and use a custom AI model 
