package com.uniservice.auth.entity;
import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.Entity;
@Entity
public class Permission extends BaseEntity{
    private String name;
    private String description;
}
