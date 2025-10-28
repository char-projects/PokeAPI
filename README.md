# PokeAPI — Generate ’em all!

Build and share your own Pokémon creations :)

The app lets users design entirely new Pokémon by mixing and matching different animal types and abilities, using real-time AI image generation through an external API.

---

## Features:

-  **AI-Powered Image Generation** using a REST API
-  **User Authentication** implemented via **OAuth2**
-  **Mobile-First Design**, fully responsive and optimized for mobile users  
-  Built following **WCAG 2.1 Level AA** guidelines:
    - Proper semantic HTML and ARIA labels
    - Keyboard navigability
    - Color contrast compliance 
-  **SPA Navigation** that supports browser back/forward buttons without full reloads  
-  **Dockerized Environment** using **Docker** and **Docker Compose**  

---

## Tech Stack:

| | |
|:------|:------------|
| Frontend | Vue + TypeScript + Vite |
| Styling | TailwindCSS |
| API | Stable Diffusion |
| Auth | OAuth2 |
| Infrastructure | Docker & Docker Compose |
| Accessibility | WCAG 2.1 AA compliance |
| API Testing | Postman |

---

## Getting started

### 1️⃣ Clone the repository
```shell
git clone https://github.com/yourusername/PokeAPI.git
cd PokeAPI
```

### 2️⃣ Configure environment variables

This project uses environment variables (.env). There are three example files in the repository:

- `./backend/.env.example`: Backend server configuration. Rename to `.env` and edit values used only by the server
- `./frontend/.env.example`: Frontend (Vite) configuration. Rename to `.env` and edit client-visible values
- `./.env.example`: Root configuration to combine frontend and backend. Rename to `.env` and **copy the values from the other two .env files** !!

How to add the missing values:

#### backend/.env
- JWT_SECRET: Generate 32 random bytes, using 

```shell
openssl rand -hex 32
```

- Google OAuth:
    1. Open this URL in your browser: https://console.cloud.google.com/
    2. Sign in with your Google account
    3. Create a new project: click the project selector (top-left) → NEW PROJECT → give it a name (e.g. "PokeAPI") → CREATE. Switch to the new project
    4. In the left search box type "APIs & Services" → click it → open "OAuth consent screen"
        - Choose "External", click Create
        - App name: PokeAPI
        - User support email: select your email
        - Developer contact email: your email
        - Save and continue through the screens (you can skip optional sections)
    5. In the left menu click "Credentials" → "+ CREATE CREDENTIALS" → "OAuth client ID"
        - Application type: Web application
        - Name: PokeAPI Web Client
        - Under "Authorized redirect URIs" click ADD URI and enter exactly:
            http://localhost:3000/api/oauth/callback
        - Click Create
    6. A dialog will show "Client ID" and "Client secret". Copy them

- OAUTH_CLIENT_ID=<paste the Client ID exactly here>
- OAUTH_CLIENT_SECRET=<paste the Client secret exactly here>

- Stable Diffusion / image provider:
    Option 1 — Local Automatic1111 WebUI:
    1. If you run the WebUI locally, its default URL is: http://localhost:7860
    2. If that server is running, in `backend/.env` set:
        - SD_API_URL=http://localhost:7860/
        - SD_API_KEY=

    Option 2 — Hosted provider (Stability.ai, Replicate, etc.):
    1. Sign up at the provider's website (e.g. https://platform.stability.ai/ or https://replicate.com/)
    2. In the provider dashboard find "API keys" or "Access tokens" and create a new API key. Copy it
    3. In `backend/.env` set:
        - SD_API_URL=<paste the provider base URL or endpoint here>
        - SD_API_KEY=<paste the API key here>

#### frontend/.env

- VITE_OAUTH_CLIENT_ID=<paste the same OAUTH_CLIENT_ID you copied from Google>
- VITE_SD_API_URL=<paste the same SD_API_URL you used in backend, if frontend needs direct access>
- VITE_SD_API_KEY=<paste the SD_API_KEY here ONLY if the frontend must call the provider directly — note this will be public>

### 3️⃣ Start both services with Docker Compose:

```bash
docker-compose up --build
```

Open http://localhost:5173 — the frontend will call the backend at http://localhost:3000

---

## Run locally without Docker

- Frontend
    - cd frontend
    - npm install
    - npm run dev

- Backend
    - cd backend
    - npm install && npm run build
    - node dist/server.js

---

## How It Works:

1. **Login** locally or with your Google account  
2. **Choose** from a list of animal types and abilities or add free-text input   
3. **Generate** a unique Pokémon using the AI image API
4. **Save** your Pokémon and view it in "My Pokémons"
5. **Share** your the link to your Pokémon or download it as a .png   

---

## Bonus Ideas (might add later):

- Share Pokémon via unique URLs or email  
- Support user-uploaded images as input 
- Add multilingual support (i18n)  
- Train and use a custom AI model 
