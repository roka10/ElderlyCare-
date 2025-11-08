# Database Schema for Elderly Care Monitoring System

## Overview
This document outlines the database structure needed to make the application fully dynamic and production-ready.

---

## 1. Users Table
**Purpose:** Store user authentication and profile information

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('caregiver', 'family')) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Static Data:** Mock user in auth-provider.tsx
**Fields to Store:**
- User credentials
- Profile information
- Role (caregiver/family member)
- Profile photo

---

## 2. Elderly_Persons Table
**Purpose:** Store information about the elderly individuals being monitored

```sql
CREATE TABLE elderly_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    medical_conditions TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Currently Missing:** No profile for the elderly person being monitored
**Fields to Store:**
- Name, age, medical history
- Emergency contact information
- Relationship to caregivers

---

## 3. User_Elderly_Relationships Table
**Purpose:** Link multiple caregivers to elderly persons (many-to-many)

```sql
CREATE TABLE user_elderly_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50), -- 'primary_caregiver', 'family', 'nurse'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, elderly_person_id)
);
```

---

## 4. Visitors Table
**Purpose:** Store known visitors and their information

```sql
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100), -- 'Family', 'Doctor', 'Nurse', 'Caregiver', 'Friend'
    photo_url TEXT,
    notes TEXT,
    last_visit TIMESTAMP,
    status VARCHAR(50) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Static Data:** knownVisitors array in visitors/page.tsx
**Fields to Store:**
- Visitor name and photo for facial recognition
- Relationship/role
- Visit history
- Status (approved/pending)

---

## 5. Unknown_Visitors Table
**Purpose:** Track unidentified visitors detected by the system

```sql
CREATE TABLE unknown_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    detection_timestamp TIMESTAMP NOT NULL,
    photo_url TEXT,
    status VARCHAR(50), -- 'unidentified', 'delivery', 'identified'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Static Data:** unknownVisitors array in visitors/page.tsx

---

## 6. Scheduled_Visits Table
**Purpose:** Track upcoming scheduled visits

```sql
CREATE TABLE scheduled_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Static Data:** upcomingVisits array in visitors/page.tsx

---

## 7. Reminders Table
**Purpose:** Store medication and task reminders

```sql
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reminder_time TIME NOT NULL,
    reminder_date DATE,
    frequency VARCHAR(50), -- 'once', 'daily', 'weekly', 'monthly'
    alexa_enabled BOOLEAN DEFAULT true,
    completed BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Static Data:** reminders array in reminders/page.tsx
**Fields to Store:**
- Reminder title and description
- Schedule (time, date, frequency)
- Alexa integration flag
- Completion status

---

## 8. Tasks Table
**Purpose:** Store daily tasks and to-do items

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status VARCHAR(50) CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    due_date DATE NOT NULL,
    due_time TIME NOT NULL,
    alexa_enabled BOOLEAN DEFAULT true,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Static Data:** tasks array in tasks/page.tsx
**Fields to Store:**
- Task details and priority
- Due date and time
- Status and completion tracking
- Alexa integration

---

## 9. Cameras Table
**Purpose:** Store connected camera information

```sql
CREATE TABLE cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- 'Living Room', 'Kitchen', etc.
    location VARCHAR(255),
    stream_url TEXT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'error'
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Static Data:** rooms array in live-feed/page.tsx
**Fields to Store:**
- Camera location/room name
- Stream URL
- Connection status

---

## 10. Activity_Logs Table
**Purpose:** Track all detected activities and events

```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    camera_id UUID REFERENCES cameras(id),
    activity_type VARCHAR(100) NOT NULL, -- 'fall_detected', 'visitor_arrival', 'motion', 'medication_taken'
    description TEXT,
    severity VARCHAR(50), -- 'info', 'warning', 'critical'
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB, -- Store additional data like emotion analysis, fall details
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id)
);
```

**Current Static Data:** Recent Activity section in dashboard/page.tsx
**Fields to Store:**
- Activity type and description
- Timestamp and severity
- Resolution status

---

## 11. Alerts Table
**Purpose:** Store alerts sent to caregivers

```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    activity_log_id UUID REFERENCES activity_logs(id),
    recipient_user_id UUID REFERENCES users(id),
    alert_type VARCHAR(100), -- 'fall', 'visitor', 'emotion', 'medication'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'read', 'acknowledged'
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    acknowledged_at TIMESTAMP
);
```

**Current Static Data:** Alerts in various dashboard components
**Fields to Store:**
- Alert details and priority
- Delivery and acknowledgment status

---

## 12. Settings Table
**Purpose:** Store user preferences and system settings

```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(50) DEFAULT 'light', -- 'light', 'dark', 'system'
    font_size VARCHAR(50) DEFAULT 'medium',
    reduce_motion BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    fall_alerts_enabled BOOLEAN DEFAULT true,
    visitor_alerts_enabled BOOLEAN DEFAULT true,
    reminder_alerts_enabled BOOLEAN DEFAULT true,
    email_notifications_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Static Data:** Settings page switches and preferences
**Fields to Store:**
- Theme and appearance preferences
- Alert notification preferences

---

## 13. Fall_Detections Table
**Purpose:** Detailed fall detection records

```sql
CREATE TABLE fall_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    camera_id UUID REFERENCES cameras(id),
    detection_timestamp TIMESTAMP NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    location VARCHAR(255),
    video_clip_url TEXT,
    screenshot_url TEXT,
    status VARCHAR(50), -- 'detected', 'false_alarm', 'confirmed', 'resolved'
    resolved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Static Data:** Fall detection status in dashboard and live feed

---

## 14. Emotion_Analysis Table
**Purpose:** Store emotion detection data

```sql
CREATE TABLE emotion_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    camera_id UUID REFERENCES cameras(id),
    timestamp TIMESTAMP NOT NULL,
    detected_emotion VARCHAR(50), -- 'calm', 'happy', 'distressed', 'sad', 'angry'
    confidence_score DECIMAL(3,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Static Data:** Emotion analysis in live-feed/page.tsx

---

## 15. Alexa_Integrations Table
**Purpose:** Track Alexa device integrations

```sql
CREATE TABLE alexa_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_person_id UUID REFERENCES elderly_persons(id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    device_id VARCHAR(255) UNIQUE,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'error'
    last_interaction TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints Needed

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Visitors
- `GET /api/visitors` - List all known visitors
- `POST /api/visitors` - Add new visitor
- `PUT /api/visitors/:id` - Update visitor
- `DELETE /api/visitors/:id` - Delete visitor
- `GET /api/visitors/unknown` - Get unknown visitors
- `GET /api/visitors/scheduled` - Get scheduled visits
- `POST /api/visitors/scheduled` - Schedule new visit
- `DELETE /api/visitors/scheduled/:id` - Cancel scheduled visit

### Reminders
- `GET /api/reminders` - List all reminders
- `POST /api/reminders` - Create reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder
- `PATCH /api/reminders/:id/complete` - Mark complete

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/complete` - Mark complete

### Live Feed
- `GET /api/cameras` - List all cameras
- `GET /api/cameras/:id/stream` - Get camera stream
- `GET /api/cameras/:id/status` - Get camera status

### Activity & Alerts
- `GET /api/activities` - Get activity logs
- `GET /api/alerts` - Get alerts
- `PATCH /api/alerts/:id/read` - Mark alert as read
- `PATCH /api/alerts/:id/acknowledge` - Acknowledge alert

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings

---

## Implementation Priority

### Phase 1: Core Authentication & Data
1. Users table and authentication
2. Elderly_Persons table
3. User_Elderly_Relationships table

### Phase 2: Visitor Management
4. Visitors table
5. Unknown_Visitors table
6. Scheduled_Visits table

### Phase 3: Tasks & Reminders
7. Reminders table
8. Tasks table

### Phase 4: Monitoring & Alerts
9. Cameras table
10. Activity_Logs table
11. Alerts table
12. Fall_Detections table
13. Emotion_Analysis table

### Phase 5: Advanced Features
14. Settings table
15. Alexa_Integrations table

---

## Technology Stack Recommendations

### Backend
- **Database:** PostgreSQL (with JSONB support)
- **API:** Flask/FastAPI (Python) or Express (Node.js)
- **Authentication:** JWT tokens with refresh tokens
- **Storage:** AWS S3 or similar for photos/videos
- **Real-time:** WebSockets for live feed and alerts

### AI/ML Integration
- **Face Recognition:** OpenCV + face_recognition library
- **Fall Detection:** YOLO or Detectron2
- **Emotion Analysis:** DeepFace or similar
- **Camera Streaming:** WebRTC or RTSP

### Frontend State Management
- **React Query / TanStack Query:** For server state management
- **Zustand or Redux:** For client state management
- **Real-time:** Socket.io for live updates

---

## Security Considerations

1. **Password Hashing:** Use bcrypt or Argon2
2. **JWT Tokens:** Store in httpOnly cookies
3. **Video Streams:** Encrypt and authenticate
4. **API Rate Limiting:** Prevent abuse
5. **RBAC:** Role-based access control
6. **Data Encryption:** Encrypt sensitive data at rest
7. **GDPR Compliance:** Data privacy and deletion rights
8. **Audit Logs:** Track all critical actions

---

## File Storage Structure

```
/uploads
  /users
    /avatars
      - {user_id}.jpg
  /visitors
    /photos
      - {visitor_id}.jpg
  /cameras
    /recordings
      - {camera_id}_{timestamp}.mp4
    /screenshots
      - {camera_id}_{timestamp}.jpg
  /fall-detections
    /clips
      - {fall_id}_{timestamp}.mp4
```

---

## Summary

**Total Tables:** 15
**Total API Endpoints:** ~40+
**Estimated Development Time:** 
- Phase 1: 2-3 weeks
- Phase 2: 2 weeks
- Phase 3: 1-2 weeks
- Phase 4: 3-4 weeks
- Phase 5: 1-2 weeks

**Total:** 9-13 weeks for full implementation

This schema provides a solid foundation for a production-ready elderly care monitoring system with all dynamic features properly implemented.

