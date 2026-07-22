/*External dependencies */
import { NextFunction, Response } from "express";

/*Local dependencies */
import * as jwtUtils from "../../utils/jwt";
import { authenticateToken, authorizeRoles } from "../auth.middleware";
import { AuthenticatedRequest } from "../types";

jest.mock("../../utils/jwt");

describe("Middlewares test", () => {
  describe("authenticateToken Middleware", () => {
    let mockRequest: Partial<AuthenticatedRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      jest.clearAllMocks();
      nextFunction = jest.fn();
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should call next() and attach user to req when token is valid", () => {
      const mockUserPayload = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "test@example.com",
        role: "admin",
      };

      mockRequest = {
        headers: {
          authorization: "Bearer valid_jwt_token",
        },
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockUserPayload);

      authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction,
      );

      expect(jwtUtils.verifyToken).toHaveBeenCalledWith("valid_jwt_token");
      expect(mockRequest.user).toEqual(mockUserPayload);
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should return 401 Unauthorized when Authorization header is missing", () => {
      mockRequest = {
        headers: {},
      };

      authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Access token required",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 401 Unauthorized when Bearer token is missing from header", () => {
      mockRequest = {
        headers: {
          authorization: "InvalidHeaderStructure",
        },
      };

      authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Access token required",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 403 Forbidden when token is invalid or expired", () => {
      mockRequest = {
        headers: {
          authorization: "Bearer expired_or_invalid_token",
        },
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error("jwt expired");
      });

      authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe("authorizeRoles Middleware", () => {
    let mockRequest: Partial<AuthenticatedRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should call next() if user role is included in allowed roles", () => {
      mockRequest = {
        user: { id: "123", role: "admin" },
      };

      const middleware = authorizeRoles("admin", "manager");
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should return 403 Forbidden if user role is not allowed", () => {
      mockRequest = {
        user: { id: "123", role: "user" },
      };

      const middleware = authorizeRoles("admin");
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Forbidden: insufficient permissions",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 401 Unauthorized if req.user is missing", () => {
      mockRequest = {};

      const middleware = authorizeRoles("admin");
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Authentication required",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
