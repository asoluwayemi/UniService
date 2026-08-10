package com.uniservice.academic.controller;

import com.uniservice.academic.dto.*;
import com.uniservice.academic.entity.AcademicCourse;
import com.uniservice.academic.entity.AcademicPublication;
import com.uniservice.academic.entity.AcademicSupervision;
import com.uniservice.academic.service.AcademicService;
import com.uniservice.auth.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/academic")
@RequiredArgsConstructor
public class AcademicController {

    private final AcademicService academicService;

    @GetMapping("/mine")
    public ResponseEntity<AcademicDataResponse> getMyAcademicData(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(academicService.getMyAcademicData(principal.getUser()));
    }

    @GetMapping("/staff/{staffProfileId}")
    public ResponseEntity<AcademicDataResponse> getAcademicDataByStaffProfileId(@PathVariable Long staffProfileId) {
        return ResponseEntity.ok(academicService.getAcademicDataByStaffProfileId(staffProfileId));
    }

    @PostMapping("/courses")
    public ResponseEntity<AcademicCourse> addCourse(@Valid @RequestBody CreateCourseRequest req,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(academicService.addCourse(req, principal.getUser()));
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        academicService.deleteCourse(id, principal.getUser());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/publications")
    public ResponseEntity<AcademicPublication> addPublication(@Valid @RequestBody CreatePublicationRequest req,
                                                               @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(academicService.addPublication(req, principal.getUser()));
    }

    @DeleteMapping("/publications/{id}")
    public ResponseEntity<Void> deletePublication(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        academicService.deletePublication(id, principal.getUser());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/supervisions")
    public ResponseEntity<AcademicSupervision> addSupervision(@Valid @RequestBody CreateSupervisionRequest req,
                                                               @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(academicService.addSupervision(req, principal.getUser()));
    }
}
