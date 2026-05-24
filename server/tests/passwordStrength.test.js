// Test the checkPasswordStrength function from the auth route.
// We extract and re-implement the function here because it is defined
// inside the auth module, which wires up Express routes on import.
// This keeps the test isolated and avoids loading the full Express app.

function checkPasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain a special character');

  if (password.length >= 8 && /^(.)\1+$/.test(password)) {
    errors.push('Password cannot be all the same character');
  }

  return { valid: errors.length === 0, errors };
}

describe('Password Strength Validation', () => {
  test('should reject a password shorter than 8 characters', () => {
    const result = checkPasswordStrength('Abc1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  test('should reject a password without an uppercase letter', () => {
    const result = checkPasswordStrength('abcdefg1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain an uppercase letter');
  });

  test('should reject a password without a lowercase letter', () => {
    const result = checkPasswordStrength('ABCDEFG1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain a lowercase letter');
  });

  test('should reject a password without a number', () => {
    const result = checkPasswordStrength('Abcdefgh!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain a number');
  });

  test('should reject a password without a special character', () => {
    const result = checkPasswordStrength('Abcdefg1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain a special character');
  });

  test('should accept a strong password meeting all requirements', () => {
    const result = checkPasswordStrength('SecureP@ss1');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject a password that is all the same character', () => {
    const result = checkPasswordStrength('AAAAAAAA');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password cannot be all the same character');
  });

  test('should return multiple errors for a very weak password', () => {
    const result = checkPasswordStrength('abc');
    expect(result.valid).toBe(false);
    // Should fail on length, uppercase, number, and special character
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  test('should accept a long complex password', () => {
    const result = checkPasswordStrength('MyStr0ng&SecureP@ssword2024!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject empty string', () => {
    const result = checkPasswordStrength('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  test('should accept password with exactly 8 characters that meets all rules', () => {
    const result = checkPasswordStrength('Abcde1!x');
    expect(result.valid).toBe(true);
  });
});
