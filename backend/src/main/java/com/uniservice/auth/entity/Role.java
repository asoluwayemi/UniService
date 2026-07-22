package com.uniservice.auth.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.Entity;

@Entity
public class Role extends BaseEntity{
    private String name;
}
