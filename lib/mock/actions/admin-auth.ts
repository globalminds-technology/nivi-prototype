"use server";

export interface LoginState {
  error?: string;
  success?: boolean;
}

export async function loginAdminAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  return { success: true };
}

export async function logoutAdminAction(): Promise<void> {
  // Mock logout
}

