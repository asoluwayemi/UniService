package com.uniservice.staff.repository;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import com.uniservice.core.common.LabelCount;
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

    @Query("select cast(p.category as string) as label, count(p) as total from StaffProfile p group by p.category")
    List<LabelCount> countByCategory();

    @Query("select cast(p.employmentStatus as string) as label, count(p) as total from StaffProfile p group by p.employmentStatus")
    List<LabelCount> countByEmploymentStatus();

    @Query("select coalesce(o.name, 'Unassigned') as label, count(p) as total from StaffProfile p left join p.orgUnit o "
            + "group by o.name order by count(p) desc, o.name asc")
    List<LabelCount> countByOrgUnit(Pageable pageable);
}
