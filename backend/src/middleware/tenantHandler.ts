import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { environment } from '../config/environment';

interface TenantPayload {
  tenantId: string;
  iat: number;
  exp: number;
}

export const tenantHandler = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // 1. Check for JWT in Authorization Header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, environment.jwtSecret) as TenantPayload;
      (req as any).tenantId = decoded.tenantId;
      return next();
    } catch (error) {
      console.error('JWT Verification Failed:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // 2. Fallback to Custom Header (for development/testing)
  const tenantIdHeader = req.headers['x-tenant-id'] as string;
  if (tenantIdHeader) {
    (req as any).tenantId = tenantIdHeader;
    return next();
  }

  // 3. Default Tenant (optional, remove in strict production)
  if (environment.nodeEnv === 'development') {
    (req as any).tenantId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    return next();
  }

  return res.status(401).json({ error: 'Authentication required (JWT or Tenant ID)' });
};
