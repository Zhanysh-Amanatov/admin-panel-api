export interface TokenPayload {
  role: string;
  userId: string;
}

export interface ComparePasswordPayload {
  hashId: string;
  plainPassword: string;
}
