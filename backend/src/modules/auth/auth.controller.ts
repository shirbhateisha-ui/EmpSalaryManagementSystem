import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response.utils.js';
import { REFRESH_TOKEN_COOKIE } from './auth.types.js';
import { authService } from './auth.service.js';

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body.email, req.body.password);

    res.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      authService.getRefreshCookieOptions(result.refreshTokenExpiresAt),
    );

    sendSuccess(res, {
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  refresh(req: Request, res: Response): void {
    const result = authService.refresh(req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined);

    res.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      authService.getRefreshCookieOptions(result.refreshTokenExpiresAt),
    );

    sendSuccess(res, {
      accessToken: result.accessToken,
    });
  },

  logout(req: Request, res: Response): void {
    authService.logout(req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined);
    res.clearCookie(REFRESH_TOKEN_COOKIE, authService.getClearRefreshCookieOptions());
    sendSuccess(res, { message: 'Logged out successfully' });
  },

  me(req: Request, res: Response): void {
    const user = authService.getMe(req.user!.id);
    sendSuccess(res, user);
  },
};
