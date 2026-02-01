
export type AppealStatus = 'pending' | 'approved' | 'denied';

export interface Appeal {
  id: string;
  username: string;
  reason: string;
  explanation: string;
  timestamp: number;
  status: AppealStatus;
  userEmail: string;
  adminNote?: string;
  isGuestAppeal?: boolean;
  ai_flag?: 'spam' | 'clean';
  aiVerified?: boolean;
  authType?: 'guest' | 'google';
}

export interface UserState {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  isGuest: boolean;
}
