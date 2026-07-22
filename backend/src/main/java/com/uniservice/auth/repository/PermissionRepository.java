package com.uniservice.auth.repository;
import com.uniservice.auth.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PermissionRepository extends JpaRepository<Permission,Long>{}
