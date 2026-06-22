import Razorpay from 'razorpay';

// FIX: Original used RAZORPAY_KEY_SECRET inconsistently — standardised here
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export const createRazorpayOrder = async (amount: number, currency = 'INR', receipt: string) => {
  return await razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency,
    receipt,
  });
};
