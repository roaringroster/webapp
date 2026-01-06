
export function isStrongPassword(password: string) {
  // We keep it simple for now.
  // The password is not used directly, but a hash of the password is used to 
  // decrypt the key for the actual local account's database.
  // Alternative packages for more complex password policies: 
  // - https://www.npmjs.com/package/check-password-strength
  // - https://www.npmjs.com/package/@zxcvbn-ts/core
  // - https://passbits.dev
  return password.length >= 8;
}
