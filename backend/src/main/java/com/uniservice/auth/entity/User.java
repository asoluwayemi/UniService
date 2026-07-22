package com.uniservice.auth.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.Entity;

@Entity
public class User extends BaseEntity {

    private String username;
    private String email;
    private String passwordHash;
    private boolean enabled = true;

}
