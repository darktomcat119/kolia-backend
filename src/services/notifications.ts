interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const message: ExpoPushMessage = {
    to: pushToken,
    title,
    body,
    data,
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  preparing: {
    title: 'Order Being Prepared',
    body: 'Your order is now being prepared by the restaurant.',
  },
  ready: {
    title: 'Order Ready',
    body: 'Your order is ready for pickup/delivery!',
  },
  on_the_way: {
    title: 'Order On The Way',
    body: 'Your order is on its way to you!',
  },
  completed: {
    title: 'Order Completed',
    body: 'Your order has been delivered. Enjoy your meal!',
  },
  cancelled: {
    title: 'Order Cancelled',
    body: 'Your order has been cancelled.',
  },
};

export function getStatusNotificationContent(status: string) {
  return STATUS_MESSAGES[status] ?? null;
}
