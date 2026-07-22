export interface TokenPayload {
  id: string;
  role: string;
}

export interface ComparePasswordPayload {
  hashId: string;
  plainPassword: string;
}
