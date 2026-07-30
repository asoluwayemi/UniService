package com.uniservice.auth.entity;

import com.uniservice.core.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;
@Entity @Table(name="roles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Role extends BaseEntity{
 @Column(unique=true,nullable=false)
 private String name;
 private String description;
 @ManyToMany(mappedBy="roles")
 @Builder.Default
 private Set<User> users=new HashSet<>();
 @ManyToMany
 @JoinTable(name="role_permissions",joinColumns=@JoinColumn(name="role_id"),inverseJoinColumns=@JoinColumn(name="permission_id"))
 @Builder.Default
 private Set<Permission> permissions=new HashSet<>();
}
