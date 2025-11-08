-- CyberForge Database Initialization Script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database (only if running outside docker-compose)
-- CREATE DATABASE cyberforge;

-- Connect to the database
-- \c cyberforge;

-- Create custom types (if not using Prisma migrations)
-- These will be created by Prisma automatically

-- Create indexes for performance
-- These will also be created by Prisma

-- Create a default admin user (optional - for initial setup)
-- Password: Admin@123 (hashed with bcrypt)
-- INSERT INTO users (id, email, username, password, "firstName", "lastName", role, "isActive", "isVerified", "createdAt", "updatedAt")
-- VALUES (
--   uuid_generate_v4(),
--   'admin@cyberforge.local',
--   'admin',
--   '$2a$10$rqYJ9iBz8Y6qLq9K8qYGJ.2h0L0p.fqVz1B9X4xZ0Z1Z2Y3X4W5V6', -- Admin@123
--   'System',
--   'Administrator',
--   'ADMIN',
--   true,
--   true,
--   NOW(),
--   NOW()
-- );

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cyberforge;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cyberforge;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO cyberforge;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- This function will be useful for any additional custom triggers
-- Prisma handles updatedAt automatically, but this is here for reference
