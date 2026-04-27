# Content Broadcasting System (Backend)

A Node.js/Express backend for educational content distribution with scheduling and rotation logic.

## Tech Stack
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **Authentication**: JWT, Bcrypt
- **File Handling**: Multer

## Prerequisites
1. A Supabase project with:
   - A bucket named `content-files` (public).
   - SQL schema from `supabase_schema.sql` executed in the SQL Editor.

## Setup Instructions
1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
4. Start the server:
   ```bash
   npm start
   ```

## API Documentation

### Auth
- `POST /api/auth/register` - { name, email, password, role }
- `POST /api/auth/login` - { email, password }

### Teacher (Protected)
- `POST /api/content/upload` - FormData { title, file, subject, description, start_time, end_time, rotation_duration }
- `GET /api/content/my-content` - View status of own uploads.

### Principal (Protected)
- `GET /api/approval/pending` - List all pending content.
- `POST /api/approval/status/:contentId` - { status, rejection_reason }
- `GET /api/approval/all` - View all content history.

### Public
- `GET /api/public/live/:teacherId` - Get currently active content for a teacher's subjects.

## Scheduling Logic
The system dynamically calculates the active content based on:
1. **Time Window**: `currentTime` must be between `start_time` and `end_time`.
2. **Approval**: Only `approved` status content is shown.
3. **Rotation**: Items for a subject rotate based on their `rotation_duration`. The rotation loops continuously based on the current minute.

## Assumptions
- Rotation duration is in minutes.
- If no content is active for a subject, it simply returns nothing for that subject.
- If the teacher has multiple subjects, the `live` endpoint returns a list of active items (one per subject).
