package com.uniservice.auth.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;
@Entity @Table(name="permissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Permission extends BaseEntity{
 @Column(unique=true,nullable=false)
 private String name;
 private String description;
 @ManyToMany(mappedBy="permissions")
 @Builder.Default
 private Set<Role> roles=new HashSet<>();
}
