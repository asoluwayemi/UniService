package com.uniservice.staff.repository;

import com.uniservice.auth.entity.User;
import com.uniservice.staff.entity.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffProfileRepository extends JpaRepository<StaffProfile, Long> {

    Optional<StaffProfile> findByUser(User user);

    boolean existsByUser(User user);

    Optional<StaffProfile> findByStaffNumber(String staffNumber);
}
