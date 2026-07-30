package com.uniservice.auth.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name="refresh_tokens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RefreshToken extends BaseEntity{
 @Column(nullable=false,unique=true,length=500)
 private String token;
 @ManyToOne(fetch=FetchType.LAZY)
 @JoinColumn(name="user_id")
 private User user;
 private Instant expiresAt;
 private boolean revoked;
}
