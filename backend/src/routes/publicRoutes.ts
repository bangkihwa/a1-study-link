import { Router, Request, Response } from 'express';
import SystemSettingsService from '../services/systemSettingsService';
import { asyncHandler } from '../middlewares/errorHandler';

export const publicRoutes = Router();

// Expose limited, non-sensitive settings to unauthenticated clients
publicRoutes.get('/settings', asyncHandler(async (_req: Request, res: Response) => {
  const settings = await SystemSettingsService.getCachedSettings();
  const publicSettings = {
    allowRegistrations: settings.allowRegistrations,
    maintenanceMode: settings.maintenanceMode
  };

  res.status(200).json({ success: true, data: publicSettings });
}));

export default publicRoutes;
