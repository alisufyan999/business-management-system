import type { User } from "@/lib/types";

export const DEMO_CREDENTIALS = {
  email: "admin@skylinettech.com",
  password: "Skyline@123",
} as const;

export const DEMO_USER: User = {
  id: "usr-admin",
  name: "Hamza Khan",
  email: DEMO_CREDENTIALS.email,
  role: "admin",
};

export function validateCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  );
}
