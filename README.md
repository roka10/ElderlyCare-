# 🧠 CareCompanion — AI-Powered Elderly Care Monitoring System

An intelligent home monitoring system that uses real-time AI detection (face recognition, emotion analysis, motion tracking, fall detection) to enhance safety and well-being for elderly individuals. Built with a **Next.js** frontend, **Flask** backend, and **Supabase** cloud database.

---

## 📸 What It Does

| Feature | How It Works |
|---|---|
| **Face Recognition** | Upload a visitor's photo → LBPH model trains → live feed shows their name |
| **Emotion Detection** | FER ONNX model analyses facial expressions in real-time (Happy, Sad, Angry, etc.) |
| **Motion Detection** | Frame-differencing detects movement and alerts when no person is visible |
| **Fall Detection** | Posture aspect-ratio analysis flags potential falls with instant alerts |
| **Visitor Management** | Add known visitors with photos, relationship, and notes — persisted in Supabase |
| **Authentication** | Email + password signup/login via Supabase Auth |
| **Real-time Dashboard** | Live status cards, alerts, and camera stream with 4 AI models running simultaneously |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React, TypeScript, ShadcnUI, Tailwind CSS |
| **Backend** | Python, Flask, Flask-SocketIO, OpenCV |
| **Database** | Supabase (PostgreSQL + Storage) |
| **Auth** | Supabase Authentication |
| **AI/ML** | OpenCV LBPH (face), ONNX FER (emotion), frame-diff (motion), aspect-ratio heuristic (fall) |
| **Real-time** | WebSocket (Socket.IO) + MJPEG stream |

---

## 📂 Project Structure

```
ElderlyCare-/
├── backend/                    # Flask API + AI detection pipeline
│   ├── app.py                 # Main server — all detection + API routes
│   ├── config.py              # Configuration (reads from .env)
│   ├── models.py              # SQLAlchemy models (legacy, kept for JWT)
│   ├── routes/                # Auth and API route blueprints
│   │   ├── auth.py
│   │   └── main.py
│   ├── known_faces/           # Auto-created: stores face photos per person
│   ├── models/                # Auto-created: stores downloaded ONNX models
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # ⚠️ YOU CREATE THIS (Supabase keys)
│
├── frontend/                   # Next.js web application
│   ├── app/                   # App router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── login/page.tsx     # Login
│   │   ├── signup/page.tsx    # Signup
│   │   └── dashboard/         # Protected dashboard pages
│   │       ├── page.tsx               # Dashboard overview
│   │       ├── live-feed/page.tsx     # Live camera + AI detection
│   │       ├── visitors/page.tsx      # Visitor management
│   │       ├── reminders/page.tsx     # Medication reminders
│   │       ├── tasks/page.tsx         # Daily tasks
│   │       └── settings/page.tsx      # User settings
│   ├── components/
│   │   ├── auth-provider.tsx  # Supabase Auth context
│   │   ├── dashboard-layout.tsx
│   │   └── ui/                # ShadcnUI components
│   ├── lib/
│   │   └── supabase.ts        # Supabase client initialisation
│   └── .env.local             # ⚠️ YOU CREATE THIS (Supabase keys)
│
├── README.md                  # ← You are here
└── DATABASE_SCHEMA.md         # Full database schema reference
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | How to Get It |
|---|---|---|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.8+ | [python.org](https://python.org/) or Anaconda |
| **Supabase Account** | Free tier | [supabase.com](https://supabase.com/) |
| **Webcam** | Any USB/built-in | For live detection features |

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-repo/ElderlyCare-.git
cd ElderlyCare-
```

---

### Step 2: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard)
2. Go to **Settings → API** and copy your **Project URL** and **anon key**
3. Go to **SQL Editor** and run this to create the required tables:

```sql
-- Users table (auto-populated on signup)
CREATE TABLE public.users (
  id          UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  name        TEXT,
  email       TEXT,
  role        TEXT,
  password    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Trigger: auto-copy user data on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, password)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'password'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Known persons table (face recognition data)
CREATE TABLE IF NOT EXISTS known_persons (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  relationship TEXT,
  notes        TEXT,
  photo_url    TEXT,
  photo_path   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE known_persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON known_persons FOR ALL USING (true);
```

4. Go to **Storage** → Create a new **public** bucket named `known-faces`
5. Go to **Authentication → Providers → Email** → Turn **OFF** "Confirm email"

---

### Step 3: Set Up the Backend

```bash
cd backend
```

#### 3a. Create the environment file

Create a file called `.env` inside the `backend/` folder:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key

SECRET_KEY=change_this_to_something_random
JWT_SECRET_KEY=change_this_to_something_random
```

#### 3b. Install Python dependencies

```bash
pip install -r requirements.txt
```

> **Note:** If using Anaconda, activate your environment first:
> ```bash
> conda activate base
> ```

#### 3c. Start the backend server

```bash
python app.py
```

You should see output like:
```
[Supabase] Connected to https://xxxx.supabase.co
[Supabase Sync] Found 0 known persons in DB.
[Emotion] FER ONNX model loaded.
 * Running on http://127.0.0.1:5000
```

> ⚠️ The first startup downloads the emotion model (~20MB). This is automatic and only happens once.

---

### Step 4: Set Up the Frontend

Open a **new terminal** and run:

```bash
cd frontend
```

#### 4a. Create the environment file

Create a file called `.env.local` inside the `frontend/` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 4b. Install Node dependencies

```bash
npm install --legacy-peer-deps
```

#### 4c. Start the development server

```bash
npm run dev
```

#### 4d. Open the app

Navigate to **http://localhost:3000** in your browser.

---

## 🔐 Authentication

This app uses **Supabase Authentication** (email + password).

- Go to `/signup` to create a new account
- Go to `/login` to sign in
- There are **no hardcoded credentials** — all users are stored in Supabase

> **Important:** Make sure "Confirm email" is **disabled** in your Supabase → Authentication → Providers → Email settings, otherwise new users won't be able to log in immediately.

---

## 🎯 How to Use

### Register a Known Visitor (for face recognition)

1. Go to **Visitors** page
2. Click **Add Visitor**
3. Upload a clear face photo + enter their name and relationship
4. Click **Add Visitor** — the photo is sent to Supabase Storage and the LBPH model retrains
5. Go to **Live Feed** → Start Camera → the person will be identified by name!

### Live AI Monitoring

1. Go to **Live Feed** page
2. Click **Start Camera**
3. All 4 detection models run simultaneously:
   - **Face Recognition** — shows the name of known visitors
   - **Emotion Detection** — analyses facial expression every 2 seconds
   - **Motion Detection** — tracks movement via frame differencing
   - **Fall Detection** — monitors posture ratio for potential falls

---

## 📦 Dependencies

### Backend (Python)

| Package | Purpose |
|---|---|
| `Flask` | Web framework |
| `Flask-SocketIO` | WebSocket for real-time updates |
| `Flask-Cors` | Cross-origin resource sharing |
| `Flask-JWT-Extended` | JWT authentication (legacy) |
| `Flask-SQLAlchemy` | ORM (legacy, for JWT session) |
| `opencv-contrib-python` | Computer vision + LBPH face recogniser |
| `numpy==1.26.4` | Numerical computing (pinned for compatibility) |
| `supabase` | Supabase Python client |
| `python-dotenv` | Load `.env` files |
| `werkzeug` | WSGI utilities |

### Frontend (Node.js)

| Package | Purpose |
|---|---|
| `next` | React framework |
| `react` / `react-dom` | UI library |
| `@supabase/supabase-js` | Supabase client for auth |
| `lucide-react` | Icons |
| `next-themes` | Theme switching |
| Various `@radix-ui/*` | ShadcnUI component primitives |

---

## 🗺️ Routes

| Route | Description | Auth Required |
|---|---|---|
| `/` | Landing page | No |
| `/login` | Login page | No |
| `/signup` | Signup page | No |
| `/dashboard` | Main dashboard overview | Yes |
| `/dashboard/live-feed` | Live camera + AI detection | Yes |
| `/dashboard/visitors` | Visitor management | Yes |
| `/dashboard/reminders` | Medication reminders | Yes |
| `/dashboard/tasks` | Daily tasks | Yes |
| `/dashboard/settings` | User settings & theme | Yes |

---

## 🔧 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/video_feed` | GET | MJPEG live video stream with AI overlays |
| `/detection_status` | GET | Current detection state (JSON) |
| `/register_face` | POST | Register face from live camera frame |
| `/register_face_upload` | POST | Register face from uploaded image |
| `/known_faces` | GET | List all registered persons |
| `/delete_face/<name>` | DELETE | Remove a registered person |
| `/auth/login` | POST | User login (legacy Flask-JWT) |
| `/auth/register` | POST | User registration (legacy Flask-JWT) |

---

## 🐛 Troubleshooting

### Backend won't start — `DLL load failed`
```bash
pip install numpy==1.26.4 --force-reinstall
pip install opencv-contrib-python --force-reinstall
```

### Frontend `npm install` fails
```bash
npm install --legacy-peer-deps
```

### Login says "Email not confirmed"
Go to **Supabase Dashboard → Authentication → Providers → Email** → Turn OFF "Confirm email" → Save. Then create a new account.

### Face recognition shows "Unknown" for registered person
- Make sure the uploaded photo has a clearly visible face
- Restart the backend after registering (the model retrains in the background, but a restart guarantees it)
- For best results, upload a well-lit, front-facing photo

### Camera not working
- Make sure no other app is using your webcam
- Check that `opencv-contrib-python` is installed (not just `opencv-python`)

---

## 📊 Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
│                                                              │
│  Signup/Login ──→ Supabase Auth                              │
│  Add Visitor ──→ POST /register_face_upload (Flask)          │
│  Live Feed   ──→ GET /video_feed (MJPEG stream)             │
│  Detection   ──→ GET /detection_status (polling every 1s)    │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│                      BACKEND (Flask)                          │
│                                                              │
│  Saves photo to disk → known_faces/<name>/photo.jpg          │
│  Uploads photo      → Supabase Storage (known-faces bucket)  │
│  Saves metadata     → Supabase DB (known_persons table)      │
│  Trains LBPH model  → In-memory (background thread)          │
│                                                              │
│  On startup:                                                 │
│    1. Fetch all known persons from Supabase DB               │
│    2. Download their photos to local disk                    │
│    3. Train LBPH model (ready before first camera frame)     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Future Improvements

- [ ] Multi-camera support
- [ ] Voice command integration (Alexa)
- [ ] Push notifications to mobile
- [ ] Video clip recording on fall detection
- [ ] Cloud-hosted deployment (Vercel + Railway)
- [ ] Multiple photos per person for better recognition accuracy

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to modify.

---

**Built with ❤️ for elderly care**