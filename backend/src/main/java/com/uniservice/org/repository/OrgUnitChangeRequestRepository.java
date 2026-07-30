package com.uniservice.org.repository;

import com.uniservice.auth.entity.User;
import com.uniservice.org.entity.ChangeRequestStatus;
import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.entity.OrgUnitChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrgUnitChangeRequestRepository extends JpaRepository<OrgUnitChangeRequest, Long> {

    List<OrgUnitChangeRequest> findByStatusOrderByCreatedAtAsc(ChangeRequestStatus status);

    List<OrgUnitChangeRequest> findByRequestedByOrderByCreatedAtDesc(User requestedBy);

    List<OrgUnitChangeRequest> findByTargetOrgUnitAndStatusAndIdNot(
            OrgUnit targetOrgUnit, ChangeRequestStatus status, Long excludedId);
}
