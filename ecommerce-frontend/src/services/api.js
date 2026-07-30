const BASE_URL =
  'https://wqh563y9sj.execute-api.ap-southeast-1.amazonaws.com';

export const apiRequest = async (
  endpoint,
  options = {},
  requiresAuth = true
) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requiresAuth) {
    const token = localStorage.getItem('accessToken');

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(
    `${BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (error) {
      console.error(error);
    }

    throw new Error(errorMessage);
  }

  return response.json();
};