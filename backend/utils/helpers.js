export const formatResponse = (success, data = null, message = null, errors = null) => {
  return {
    success,
    data,
    message,
    errors,
    timestamp: new Date().toISOString()
  };
};

export const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};