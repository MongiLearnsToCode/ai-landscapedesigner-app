// Database service now uses API calls instead of direct DB access

export const ensureUserExists = async (userId: string, email: string, name: string): Promise<void> => {
  console.log('👤 Ensuring user exists via API:', userId);

  try {
    const response = await fetch('/api/users/ensure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, name }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ User ensured via API');
  } catch (error) {
    console.error('❌ Error ensuring user exists:', error);
    throw error;
  }
};
