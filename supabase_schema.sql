-- Content Broadcasting System Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('principal', 'teacher')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Table
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    rotation_duration INTEGER DEFAULT 5, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Slots (Subject-based grouping)
-- Note: In this implementation, slots can be derived but we'll use this for explicit ordering if needed
CREATE TABLE content_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Schedule (Explicit rotation order if needed)
CREATE TABLE content_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES content_slots(id) ON DELETE CASCADE,
    rotation_order INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS (Row Level Security) - Optional but good for Supabase
-- For this assignment, we will handle auth in the Express backend, 
-- but these tables provide the structure.
