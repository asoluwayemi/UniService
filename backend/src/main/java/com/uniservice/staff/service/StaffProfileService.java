package com.uniservice.staff.service;

import com.uniservice.appraisal.service.AppraisalService;
import com.uniservice.auth.dto.UserSummaryResponse;
import com.uniservice.auth.entity.Role;
import com.uniservice.auth.entity.User;
import com.uniservice.auth.repository.UserRepository;
import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.entity.OrgUnitStatus;
import com.uniservice.org.repository.OrgUnitRepository;
import com.uniservice.staff.dto.*;
import com.uniservice.staff.entity.AcademicQualification;
import com.uniservice.staff.entity.EmploymentHistory;
import com.uniservice.staff.entity.StaffProfile;
import com.uniservice.staff.repository.AcademicQualificationRepository;
import com.uniservice.staff.repository.EmploymentHistoryRepository;
import com.uniservice.staff.repository.StaffProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffProfileService {

    private final StaffProfileRepository staffProfileRepository;
    private final AcademicQualificationRepository qualificationRepository;
    private final EmploymentHistoryRepository employmentHistoryRepository;
    private final UserRepository userRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final AppraisalService appraisalService;

    public List<StaffProfileSummaryResponse> listAll() {
        return staffProfileRepository.findAll().stream().map(StaffProfileSummaryResponse::from).toList();
    }

    public StaffProfileResponse getById(Long id) {
        return toResponse(findProfile(id));
    }

    public StaffProfileResponse getMine(User currentUser) {
        StaffProfile profile = staffProfileRepository.findByUser(currentUser)
                .orElseThrow(() -> new NoSuchElementException("No staff profile exists for this account yet"));
        return toResponse(profile);
    }

    public List<UserSummaryResponse> listEligibleUsers() {
        return userRepository.findAll().stream()
                .filter(u -> !staffProfileRepository.existsByUser(u))
                .map(u -> new UserSummaryResponse(
                        u.getId(), u.getUsername(), u.getEmail(), u.getFirstName(), u.getLastName(),
                        u.isEnabled(),
                        u.getRoles().stream().map(Role::getName).collect(Collectors.toCollection(TreeSet::new))))
                .toList();
    }

    @Transactional
    public StaffProfileResponse create(CreateStaffProfileRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (staffProfileRepository.existsByUser(user)) {
            throw new IllegalArgumentException("This user already has a staff profile");
        }
        assertStaffNumberAvailable(request.getStaffNumber(), null);

        StaffProfile profile = StaffProfile.builder()
                .user(user)
                .staffNumber(request.getStaffNumber())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .phone(request.getPhone())
                .address(request.getAddress())
                .nationality(request.getNationality())
                .category(request.getCategory())
                .designation(request.getDesignation())
                .orgUnit(resolveOrgUnit(request.getOrgUnitId()))
                .employmentType(request.getEmploymentType())
                .dateOfHire(request.getDateOfHire())
                .contractStartDate(request.getContractStartDate())
                .contractEndDate(request.getContractEndDate())
                .bankName(request.getBankName())
                .bankAccountName(request.getBankAccountName())
                .bankAccountNumber(request.getBankAccountNumber())
                .dateOfFirstAppointment(request.getDateOfFirstAppointment())
                .dateAppointedToPresentPost(request.getDateAppointedToPresentPost())
                .scheduleOfDuties(request.getScheduleOfDuties())
                .presentScaleAndSalary(request.getPresentScaleAndSalary())
                .dateOfNextIncrement(request.getDateOfNextIncrement())
                .lastPromotionDate(request.getLastPromotionDate())
                .build();

        StaffProfile saved = staffProfileRepository.save(profile);
        return toResponse(saved);
    }

    @Transactional
    public StaffProfileResponse update(Long id, UpdateStaffProfileRequest request) {
        StaffProfile profile = findProfile(id);

        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setPhone(request.getPhone());
        profile.setAddress(request.getAddress());
        profile.setNationality(request.getNationality());
        profile.setCategory(request.getCategory());
        profile.setDesignation(request.getDesignation());
        profile.setOrgUnit(resolveOrgUnit(request.getOrgUnitId()));
        profile.setEmploymentType(request.getEmploymentType());
        profile.setEmploymentStatus(request.getEmploymentStatus());
        profile.setDateOfHire(request.getDateOfHire());
        profile.setContractStartDate(request.getContractStartDate());
        profile.setContractEndDate(request.getContractEndDate());
        profile.setBankName(request.getBankName());
        profile.setBankAccountName(request.getBankAccountName());
        profile.setBankAccountNumber(request.getBankAccountNumber());
        profile.setDateOfFirstAppointment(request.getDateOfFirstAppointment());
        profile.setDateAppointedToPresentPost(request.getDateAppointedToPresentPost());
        profile.setScheduleOfDuties(request.getScheduleOfDuties());
        profile.setPresentScaleAndSalary(request.getPresentScaleAndSalary());
        profile.setDateOfNextIncrement(request.getDateOfNextIncrement());
        profile.setLastPromotionDate(request.getLastPromotionDate());

        StaffProfile saved = staffProfileRepository.save(profile);
        return toResponse(saved);
    }

    @Transactional
    public StaffProfileResponse addQualification(Long staffProfileId, AddQualificationRequest request) {
        StaffProfile profile = findProfile(staffProfileId);
        AcademicQualification qualification = AcademicQualification.builder()
                .staffProfile(profile)
                .degree(request.getDegree())
                .fieldOfStudy(request.getFieldOfStudy())
                .institution(request.getInstitution())
                .yearObtained(request.getYearObtained())
                .build();
        qualificationRepository.save(qualification);
        return toResponse(profile);
    }

    @Transactional
    public StaffProfileResponse removeQualification(Long staffProfileId, Long qualificationId) {
        StaffProfile profile = findProfile(staffProfileId);
        AcademicQualification qualification = qualificationRepository.findById(qualificationId)
                .orElseThrow(() -> new NoSuchElementException("Qualification not found"));
        if (!qualification.getStaffProfile().getId().equals(profile.getId())) {
            throw new IllegalArgumentException("This qualification does not belong to the given staff profile");
        }
        qualificationRepository.delete(qualification);
        return toResponse(profile);
    }

    @Transactional
    public StaffProfileResponse addEmploymentHistory(Long staffProfileId, AddEmploymentHistoryRequest request) {
        StaffProfile profile = findProfile(staffProfileId);
        EmploymentHistory history = EmploymentHistory.builder()
                .staffProfile(profile)
                .organization(request.getOrganization())
                .positionTitle(request.getPositionTitle())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .description(request.getDescription())
                .build();
        employmentHistoryRepository.save(history);
        return toResponse(profile);
    }

    @Transactional
    public StaffProfileResponse removeEmploymentHistory(Long staffProfileId, Long historyId) {
        StaffProfile profile = findProfile(staffProfileId);
        EmploymentHistory history = employmentHistoryRepository.findById(historyId)
                .orElseThrow(() -> new NoSuchElementException("Employment history entry not found"));
        if (!history.getStaffProfile().getId().equals(profile.getId())) {
            throw new IllegalArgumentException("This employment history entry does not belong to the given staff profile");
        }
        employmentHistoryRepository.delete(history);
        return toResponse(profile);
    }

    private StaffProfile findProfile(Long id) {
        return staffProfileRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Staff profile not found"));
    }

    private void assertStaffNumberAvailable(String staffNumber, Long excludingProfileId) {
        staffProfileRepository.findByStaffNumber(staffNumber)
                .filter(existing -> !existing.getId().equals(excludingProfileId))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Staff number '" + staffNumber + "' is already in use");
                });
    }

    private OrgUnit resolveOrgUnit(Long orgUnitId) {
        if (orgUnitId == null) {
            return null;
        }
        OrgUnit orgUnit = orgUnitRepository.findById(orgUnitId)
                .orElseThrow(() -> new IllegalArgumentException("Org unit not found"));
        if (orgUnit.getStatus() != OrgUnitStatus.ACTIVE) {
            throw new IllegalArgumentException("Org unit is archived");
        }
        return orgUnit;
    }

    private StaffProfileResponse toResponse(StaffProfile profile) {
        List<AcademicQualification> qualifications = qualificationRepository.findByStaffProfile(profile);
        List<EmploymentHistory> employmentHistory = employmentHistoryRepository.findByStaffProfile(profile);
        int completedAppraisalsSincePromotion = appraisalService.countCompletedAppraisalsSincePromotion(profile);
        boolean eligibleForPromotion = completedAppraisalsSincePromotion >= 3;
        return StaffProfileResponse.from(profile, qualifications, employmentHistory,
                completedAppraisalsSincePromotion, eligibleForPromotion);
    }
}
