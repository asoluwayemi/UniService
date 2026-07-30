package com.uniservice.staff.repository;

import com.uniservice.staff.entity.EmploymentHistory;
import com.uniservice.staff.entity.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmploymentHistoryRepository extends JpaRepository<EmploymentHistory, Long> {

    List<EmploymentHistory> findByStaffProfile(StaffProfile staffProfile);
}
