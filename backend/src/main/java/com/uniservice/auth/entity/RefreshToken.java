package com.uniservice.auth.entity;
import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.Entity;
@Entity
public class RefreshToken extends BaseEntity{
    private String token;
    private java.time.Instant expiresAt;
}
