/*External dependencies */
import { Request } from "express";

/*Local dependencies */
import { TokenPayload } from "../utils/types";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
