-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    national_id TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    user_name TEXT,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    data TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT, -- Can be 'admin' or a user UUID
    submission_id TEXT REFERENCES submissions(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    submission_id TEXT REFERENCES submissions(id),
    user_id TEXT REFERENCES users(id),
    user_name TEXT,
    type TEXT,
    signature_data TEXT,
    signed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Submission History Table
CREATE TABLE IF NOT EXISTS submission_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id TEXT REFERENCES submissions(id),
    status TEXT NOT NULL,
    changed_by TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initial Admin User (Optional, but useful for first login)
-- INSERT INTO users (id, national_id, phone, role) VALUES ('admin', 'admin', '0000000000', 'admin') ON CONFLICT DO NOTHING;
