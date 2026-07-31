package com.uniservice.auth.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name="users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User extends BaseEntity{
 @Column(nullable=false,unique=true,length=50)
 private String username;
 @Column(nullable=false,unique=true,length=120)
 private String email;
 @Column(nullable=false,length=100)
 private String firstName;
 @Column(nullable=false,length=100)
 private String lastName;
 @Column(nullable=false)
 private String passwordHash;
 @Column(nullable=false)
 private boolean enabled=true;
 @ManyToMany(fetch=FetchType.EAGER)
 @JoinTable(name="user_roles",
 joinColumns=@JoinColumn(name="user_id"),
 inverseJoinColumns=@JoinColumn(name="role_id"))
 @Builder.Default
 private Set<Role> roles=new HashSet<>();

 @Column(name="totp_secret", length=255)
 private String totpSecret;
 @Column(name="totp_enabled", nullable=false)
 @Builder.Default
 private boolean totpEnabled=false;
 @Column(name="totp_enrolled_at")
 private Instant totpEnrolledAt;
 @Column(name="hr_step_up_expires_at")
 private Instant hrStepUpExpiresAt;
}
