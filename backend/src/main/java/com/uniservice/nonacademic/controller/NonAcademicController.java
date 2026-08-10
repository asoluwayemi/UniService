package com.uniservice.nonacademic.controller;

import com.uniservice.auth.security.UserPrincipal;
import com.uniservice.nonacademic.dto.*;
import com.uniservice.nonacademic.entity.NonAcademicProject;
import com.uniservice.nonacademic.entity.NonAcademicTraining;
import com.uniservice.nonacademic.service.NonAcademicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/non-academic")
@RequiredArgsConstructor
public class NonAcademicController {

    private final NonAcademicService nonAcademicService;

    @GetMapping("/mine")
    public ResponseEntity<NonAcademicDataResponse> getMyNonAcademicData(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(nonAcademicService.getMyNonAcademicData(principal.getUser()));
    }

    @GetMapping("/staff/{staffProfileId}")
    public ResponseEntity<NonAcademicDataResponse> getNonAcademicDataByStaffProfileId(@PathVariable Long staffProfileId) {
        return ResponseEntity.ok(nonAcademicService.getNonAcademicDataByStaffProfileId(staffProfileId));
    }

    @PostMapping("/trainings")
    public ResponseEntity<NonAcademicTraining> addTraining(@Valid @RequestBody CreateTrainingRequest req,
                                                           @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(nonAcademicService.addTraining(req, principal.getUser()));
    }

    @DeleteMapping("/trainings/{id}")
    public ResponseEntity<Void> deleteTraining(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        nonAcademicService.deleteTraining(id, principal.getUser());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/projects")
    public ResponseEntity<NonAcademicProject> addProject(@Valid @RequestBody CreateProjectRequest req,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(nonAcademicService.addProject(req, principal.getUser()));
    }

    @DeleteMapping("/projects/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        nonAcademicService.deleteProject(id, principal.getUser());
        return ResponseEntity.noContent().build();
    }
}
