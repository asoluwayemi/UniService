package com.uniservice.auth.dto;

public record TotpSetupResponse(String secret, String otpAuthUri, String qrCodeDataUri) {
}
