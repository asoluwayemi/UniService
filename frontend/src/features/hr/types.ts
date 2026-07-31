export interface TotpSetupResponse {
  secret: string;
  otpAuthUri: string;
  qrCodeDataUri: string;
}

export interface HrStepUpResponse {
  hrStepUpExpiresAt: string;
}
