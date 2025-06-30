import { getData, auth } from './data';

export async function getUserRole(userId: string): Promise<string | null> {
  const user = getData.getUserById(userId);
  return user?.role || null;
}

export async function getUserProfile(userId: string) {
  return getData.getUserById(userId);
}

export async function getNotifications(userId: string) {
  // In a static version, we'll return an empty array
  return [];
}

export async function markNotificationAsRead(notificationId: string) {
  // In a static version, we'll just return true
  return true;
}

export async function subscribeToNotifications(userId: string, callback: (payload: any) => void) {
  // In a static version, we'll return a mock unsubscribe function
  return Promise.resolve({
    unsubscribe: () => {}
  });
}
