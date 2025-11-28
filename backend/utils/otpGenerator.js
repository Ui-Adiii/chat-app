import crypto from 'crypto';

const otpGenerator = async () => {
    // Generate a cryptographically secure 6-digit OTP
    const buffer = crypto.randomBytes(3);
    const otp = (buffer.readUIntBE(0, 3) % 1000000).toString().padStart(6, '0');
    return otp;
}

export default otpGenerator