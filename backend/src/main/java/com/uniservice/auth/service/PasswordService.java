package com.uniservice.auth.service;

import com.uniservice.auth.dto.PasswordChangeRequest;

public interface PasswordService {
    void changePassword(String username, PasswordChangeRequest request);
}
