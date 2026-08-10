package com.uniservice.promotion.repository;

import com.uniservice.promotion.entity.PromotionApplication;
import com.uniservice.staff.entity.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PromotionApplicationRepository extends JpaRepository<PromotionApplication, Long> {
    List<PromotionApplication> findByStaffProfileOrderByCreatedAtDesc(StaffProfile staffProfile);
    boolean existsByStaffProfileAndStatusIn(StaffProfile staffProfile, List<com.uniservice.promotion.entity.PromotionApplicationStatus> statuses);
}
