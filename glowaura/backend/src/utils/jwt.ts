import jwt from 'jsonwebtoken';

// FIXED: Original used: process.env.JWT_REFRESH_SECRET as string || 'refresh_secret'
// Operator precedence bug — 'as string' cast happens before '||', so fallback never works

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRE as string) || '30d',
  });
};

export const verifyToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
};
