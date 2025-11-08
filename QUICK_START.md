# Quick Start Guide - Elderly Care Monitoring System Prototype

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- pnpm installed (or npm/yarn)

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```
   
   If you don't have pnpm, use:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Run development server:**
   ```bash
   pnpm dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

---

## 🔐 Login Credentials

**IMPORTANT:** Only these credentials will work:

```
Email: priyanshr230@gmail.com
Password: 1234
```

Any other credentials will show an error message.

---

## 🎨 Features to Test

### 1. Authentication
- ✅ **Login** with the credentials above
- ✅ **Logout** from the settings page or sidebar
- ✅ **Signup page** (UI only - doesn't create real accounts yet)

### 2. Dashboard
- ✅ View status overview
- ✅ See recent activity feed
- ✅ Check today's reminders
- ✅ SOS Call button (UI only)

### 3. Live Feed
- ✅ Switch between rooms (Living Room, Kitchen, Bedroom, Entrance)
- ✅ Toggle camera controls (mic, camera, speaker)
- ✅ View status cards (normal activity, emotion, fall detection)
- ✅ See recent alerts
- ✅ Fullscreen mode
- ⚠️ Actual video feed not implemented yet

### 4. Visitors Management ⭐ DYNAMIC
- ✅ **Add new visitor** with optional visit scheduling
  - Enter name
  - Select relationship
  - Check "Schedule an upcoming visit"
  - Pick date and time
  - Click "Add & Schedule Visit"
- ✅ **Schedule visit** from Upcoming Visits tab
  - Click "Schedule New Visit" button
  - Fill in all details
  - Visit appears in list
- ✅ **Delete visits** by clicking X button
- ⚠️ Data resets on page refresh (needs backend)

### 5. Reminders
- ✅ View today's reminders
- ✅ View upcoming reminders
- ✅ View completed reminders
- ✅ Search reminders
- ✅ Open "Add Reminder" dialog (UI only)
- ⚠️ Adding reminders doesn't persist yet

### 6. Tasks
- ✅ View today's tasks
- ✅ View upcoming tasks
- ✅ View all tasks (pending & completed)
- ✅ See priority levels
- ✅ Search tasks
- ✅ Open "Add Task" dialog (UI only)
- ⚠️ Adding tasks doesn't persist yet

### 7. Settings ⭐ FULLY FUNCTIONAL
- ✅ **Profile Information**
  - View user profile
  - Update name and email (UI only)
  - Change role
- ✅ **Security**
  - Change password (UI only)
- ✅ **Theme Switcher** ⭐ WORKS!
  - Switch between Light/Dark/System theme
  - Theme persists across sessions
- ✅ **Appearance Settings**
  - Font size selector
  - Reduce motion toggle
  - High contrast toggle
- ✅ **Alert Preferences**
  - Toggle fall detection alerts
  - Toggle visitor alerts
  - Toggle reminder alerts
  - Toggle email notifications
- ✅ **Logout Button**

---

## 🎯 What Works vs What Doesn't

### ✅ Fully Working
- Login/Logout with fixed credentials
- Theme switching (Light/Dark/System)
- Navigation between all pages
- Visitor scheduling (in memory)
- Deleting scheduled visits (in memory)
- UI for all features
- Responsive design
- Toast notifications

### ⚠️ Partially Working
- Adding visitors (works but doesn't persist)
- Scheduling visits (works but doesn't persist)
- Settings toggles (UI only, don't save)

### ❌ Not Yet Implemented
- Signup (creates user but doesn't persist)
- Completing reminders
- Completing tasks
- Live camera streams
- Face recognition
- Fall detection AI
- Emotion analysis
- Real-time alerts
- Email notifications
- Alexa integration

---

## 🗺️ Page Routes

| Route | Description | Status |
|-------|-------------|--------|
| `/` | Landing page | ✅ |
| `/login` | Login page | ✅ |
| `/signup` | Signup page | ✅ |
| `/dashboard` | Main dashboard | ✅ (Protected) |
| `/dashboard/live-feed` | Camera feeds | ✅ (Protected) |
| `/dashboard/visitors` | Visitor management | ✅ (Protected, Dynamic) |
| `/dashboard/reminders` | Reminders | ✅ (Protected) |
| `/dashboard/tasks` | Tasks | ✅ (Protected) |
| `/dashboard/settings` | Settings | ✅ (Protected) |

---

## 🎨 Theme Testing

The theme switcher is **fully functional**:

1. Go to **Settings** page
2. Click on **Appearance** tab
3. Select theme:
   - **Light** - Light theme always
   - **Dark** - Dark theme always
   - **System** - Follows your OS preference

Theme choice is **saved in localStorage** and persists across sessions!

---

## 📱 Responsive Design

Test on different screen sizes:
- ✅ Desktop (1920px+)
- ✅ Laptop (1280px+)
- ✅ Tablet (768px+)
- ✅ Mobile (320px+)

All pages are fully responsive with:
- Collapsible sidebar on mobile
- Responsive grids and cards
- Touch-friendly buttons
- Mobile-optimized forms

---

## 🧪 Testing Visitor Scheduling

**Step-by-step guide:**

1. **Login** with credentials
2. Go to **Visitors** page
3. Click on **Upcoming Visits** tab
4. Click **"Add Visitor"** button at top
5. Fill in form:
   - Name: "John Doe"
   - Relationship: "Doctor"
   - Notes: "Monthly checkup"
   - ✅ Check "Schedule an upcoming visit"
   - Date: Pick tomorrow's date
   - Time: Pick 2:00 PM
6. Click **"Add & Schedule Visit"**
7. **Success!** You'll see:
   - Toast notification: "Visit scheduled for John Doe"
   - New visit appears in Upcoming Visits list
8. Click **X** to delete the visit
9. **Success!** Visit removed with toast notification

**Alternative Method:**
1. Go to **Upcoming Visits** tab
2. Scroll to bottom
3. Click **"Schedule New Visit"** button
4. Fill form and submit

⚠️ **Note:** Close and reopen browser - data will be lost (needs backend)

---

## 🐛 Known Issues

1. **Data doesn't persist** - Need backend integration
2. **Camera feeds are placeholders** - Need real camera integration
3. **Signup creates mock user** - Need database
4. **Some buttons are UI only** - Need API endpoints
5. **No real-time updates** - Need WebSocket connection

---

## 📦 Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Protected dashboard pages
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── layout.tsx        # Root layout with Toaster
│   └── page.tsx          # Landing page
│
├── components/
│   ├── auth-provider.tsx  # Auth context with fixed credentials
│   ├── dashboard-layout.tsx
│   ├── theme-provider.tsx
│   └── ui/               # Reusable UI components
│
├── lib/
│   └── utils.ts          # Utility functions
│
└── public/               # Static assets
```

---

## 🎓 For Developers

### Adding New Features

1. **Static data** is in page components
2. **To make dynamic**, replace with:
   ```tsx
   const [data, setData] = useState([])
   
   // Later with backend:
   const { data } = useQuery('key', fetchData)
   ```

3. **For forms**, use controlled inputs:
   ```tsx
   const [value, setValue] = useState('')
   <Input value={value} onChange={(e) => setValue(e.target.value)} />
   ```

### Database Integration Guide

See `DATABASE_SCHEMA.md` for:
- Complete database schema
- All table structures
- API endpoints needed
- Implementation phases

See `IMPLEMENTATION_STATUS.md` for:
- What's complete vs what's not
- Detailed status of each feature
- Next steps for production

---

## 🆘 Troubleshooting

### Can't Login
- ✅ Check you're using: `priyanshr230@gmail.com` / `1234`
- ❌ Any other credentials will fail

### Theme Not Changing
- Clear browser localStorage
- Reload page
- Try switching themes again

### Data Disappeared
- This is expected - no backend yet
- Data is only in memory (React state)
- Refresh = data lost

### Package Installation Errors
```bash
# If pnpm errors:
npm install --legacy-peer-deps

# If React version conflicts:
npm install --force
```

---

## 🎉 Demo Flow

**Perfect demo sequence:**

1. Open landing page - show features
2. Click "Get Started" → Login
3. Enter credentials and login
4. Show Dashboard overview
5. Go to Visitors → Add a visitor with scheduled visit
6. Go to Live Feed → Show camera interface
7. Go to Reminders → Show today's reminders
8. Go to Tasks → Show task management
9. Go to Settings → Change theme to demonstrate it works
10. Logout

**Time:** ~5 minutes for complete demo

---

## 📄 Additional Resources

- `DATABASE_SCHEMA.md` - Complete database design
- `IMPLEMENTATION_STATUS.md` - Detailed project status
- `README.md` - Project overview (if exists)

---

## 🚀 Next Steps

1. ✅ **Prototype is complete** - You're here!
2. ❌ **Set up backend** - See DATABASE_SCHEMA.md
3. ❌ **Create API** - RESTful API with authentication
4. ❌ **Connect frontend** - Replace static data with API calls
5. ❌ **Add real-time** - WebSocket for live updates
6. ❌ **Deploy** - Production deployment

---

**Enjoy exploring the prototype! 🎊**

For questions or issues, refer to the documentation files or check the code comments.

