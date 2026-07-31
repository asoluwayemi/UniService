package com.uniservice.org.repository;

import com.uniservice.auth.entity.User;
import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.entity.OrgUnitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrgUnitRepository extends JpaRepository<OrgUnit, Long> {

    List<OrgUnit> findByStatus(OrgUnitStatus status);

    List<OrgUnit> findByParentAndStatus(OrgUnit parent, OrgUnitStatus status);

    Optional<OrgUnit> findByCodeIgnoreCaseAndStatus(String code, OrgUnitStatus status);

    List<OrgUnit> findByHeadAndStatus(User head, OrgUnitStatus status);

    Optional<OrgUnit> findByHrUnitTrueAndStatus(OrgUnitStatus status);
}
