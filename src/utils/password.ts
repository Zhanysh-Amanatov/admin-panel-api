/*External dependencies */
import bcrypt from "bcryptjs";

/*Local dependencies */
import { ComparePasswordPayload } from "./types";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  paylaod: ComparePasswordPayload,
): Promise<boolean> {
  const { plainPassword, hashId } = paylaod;

  return bcrypt.compare(plainPassword, hashId);
}
