import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// FIXED: Original v1 used 'isAdmin:Boolean', v2 used 'role:enum' — merged to role-based (v2 is superior)
// FIXED: v1 missing wishlist field — added from v2
// FIXED: v1 used bcrypt.genSalt(10), v2 used hash(pw,12) — using 12 rounds (stronger)

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  wishlist: mongoose.Types.ObjectId[];
  addresses: {
    _id?: mongoose.Types.ObjectId;
    name: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    isDefault: boolean;
  }[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const addressSchema = new Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: { type: String, required: [true, 'Password is required'], select: false, minlength: 6 },
    phone: { type: String },
    avatar: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    addresses: [addressSchema],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
