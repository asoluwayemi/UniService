package com.uniservice.leave.repository;

import org.springframework.data.jpa.repository.Query;
import com.uniservice.core.common.LabelCount;
import com.uniservice.leave.entity.*;
import com.uniservice.staff.entity.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByStaffProfileOrderByCreatedAtDesc(StaffProfile staffProfile);
    List<LeaveRequest> findByStatusOrderByCreatedAtAsc(LeaveStatus status);
    List<LeaveRequest> findByHandoverOfficerIdOrderByCreatedAtDesc(Long handoverOfficerId);
    List<LeaveRequest> findByStaffProfileAndStatusIn(StaffProfile staffProfile, List<LeaveStatus> statuses);
    @Query("select cast(l.status as string) as label, count(l) as total from LeaveRequest l group by l.status")
    List<LabelCount> countByStatus();
}
