/**
 * OTP Routes - In-memory OTP generation and verification
 * POST /api/v1/otp/send   - Generate and send OTP (logged to console)
 * POST /api/v1/otp/verify - Verify OTP for a mobile number
 */

import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

interface OtpRecord {
  otp: string;
  expiresAt: Date;
  attempts: number;
}

// In-memory store: mobileNumber -> OtpRecord
// In production this would be Redis / DB with TTL
const otpStore = new Map<string, OtpRecord>();

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const mobileSchema = z.object({
  mobileNumber: z
    .string({ required_error: 'mobileNumber is required' })
    .regex(/^[6-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian number starting with 6-9'),
});

/**
 * POST /api/v1/otp/send
 * Generates a fresh 6-digit OTP (invalidates any previous one) and logs it.
 * In production this would send via SMS (Twilio / AWS SNS / MSG91).
 */
router.post('/send', (req, res, next) => {
  try {
    const parseResult = mobileSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new AppError(400, 'VALIDATION_ERROR', issue.message, ['mobileNumber']);
    }

    const { mobileNumber } = parseResult.data;
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Overwrite any existing OTP for this mobile (resend scenario)
    otpStore.set(mobileNumber, { otp, expiresAt, attempts: 0 });

    // ⚠️  In production: send via SMS provider (MSG91 / Twilio / SNS)
    // For development/demo: log to console
    console.log(`[OTP] Mobile: ${mobileNumber.slice(0, 4)}XXXX${mobileNumber.slice(-2)} | OTP: ${otp} | Expires: ${expiresAt.toISOString()}`);

    res.status(200).json({
      success: true,
      message: `OTP sent to mobile ending in ${mobileNumber.slice(-4)}`,
      // For local testing only — REMOVE in production
      ...(process.env.NODE_ENV === 'development' && { _devOtp: otp }),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/otp/verify
 * Validates the OTP. On success, marks as consumed (removes from store).
 */
router.post('/verify', (req, res, next) => {
  try {
    const parseResult = z.object({
      mobileNumber: z
        .string({ required_error: 'mobileNumber is required' })
        .regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
      otp: z
        .string({ required_error: 'otp is required' })
        .length(6, 'OTP must be 6 digits')
        .regex(/^\d{6}$/, 'OTP must be numeric'),
    }).safeParse(req.body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      const field = issue.path[0]?.toString() || '';
      throw new AppError(400, 'VALIDATION_ERROR', issue.message, [field]);
    }

    const { mobileNumber, otp } = parseResult.data;
    const record = otpStore.get(mobileNumber);

    if (!record) {
      throw new AppError(400, 'OTP_NOT_FOUND', 'No OTP found for this mobile. Please request a new OTP.', ['otp']);
    }

    if (new Date() > record.expiresAt) {
      otpStore.delete(mobileNumber);
      throw new AppError(400, 'OTP_EXPIRED', 'OTP has expired. Please request a new OTP.', ['otp']);
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(mobileNumber);
      throw new AppError(429, 'OTP_MAX_ATTEMPTS', 'Too many incorrect attempts. Please request a new OTP.', ['otp']);
    }

    if (record.otp !== otp) {
      record.attempts += 1;
      const remaining = MAX_ATTEMPTS - record.attempts;
      throw new AppError(
        400,
        'OTP_INVALID',
        `Incorrect OTP. ${remaining} attempt(s) remaining.`,
        ['otp']
      );
    }

    // ✅ Valid OTP – consume it (prevent reuse)
    otpStore.delete(mobileNumber);

    res.status(200).json({
      success: true,
      message: 'Mobile number verified successfully.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
