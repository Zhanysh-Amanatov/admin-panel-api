export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  created_at?: Date;
}

export interface UserRow {
  id: string;
  email: string;
  password: string;
  role: "user" | "admin";
}
