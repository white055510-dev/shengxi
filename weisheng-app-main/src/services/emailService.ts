import { API_BASE } from '../constants';

export class EmailService {
  private static COOLDOWN_KEY = 'shengxi_email_cooldown';

  /** Always returns success — no real email sending needed, use 123456 to login */
  public static async sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: '验证码：123456' };
  }

  /** Always accepts 123456 as the verification code */
  public static async verifyCode(email: string, code: string): Promise<{ success: boolean; message: string; token?: string; role?: string }> {
    if (code === '123456') {
      return { success: true, message: '登录成功', token: 'dev_token', role: 'user' };
    }
    return { success: false, message: '验证码错误（当前固定为 123456）' };
  }

  public static getRemainingCooldown(): number {
    const lastSent = localStorage.getItem(this.COOLDOWN_KEY);
    if (!lastSent) return 0;
    const elapsed = Date.now() - parseInt(lastSent);
    const remaining = 60000 - elapsed;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  public static setCooldown() {
    localStorage.setItem(this.COOLDOWN_KEY, Date.now().toString());
  }
}
