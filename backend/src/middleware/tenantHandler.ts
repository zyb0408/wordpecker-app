import { Request, Response, NextFunction } from 'express';

export const tenantHandler = (req: Request, res: Response, next: NextFunction) => {
  // In a real-world scenario, you might get tenant_id from:
  // 1. Subdomain: req.subdomains[0]
  // 2. Custom Header: req.headers['x-tenant-id']
  // 3. Auth Token: req.user.tenant_id
  
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    // For demo purposes, we can default to a specific tenant or return error
    // return res.status(400).json({ error: 'Tenant ID is required' });
    (req as any).tenantId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Default Tenant
  } else {
    (req as any).tenantId = tenantId;
  }

  next();
};
