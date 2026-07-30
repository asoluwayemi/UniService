package com.uniservice.appraisal.controller;

import com.uniservice.appraisal.dto.AppraisalCycleResponse;
import com.uniservice.appraisal.dto.CreateAppraisalCycleRequest;
import com.uniservice.appraisal.service.AppraisalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appraisal-cycles")
@RequiredArgsConstructor
public class AppraisalCycleController {

    private final AppraisalService appraisalService;

    @GetMapping
    public List<AppraisalCycleResponse> list() {
        return appraisalService.listCycles();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('APPRAISAL_MANAGE')")
    public AppraisalCycleResponse create(@Valid @RequestBody CreateAppraisalCycleRequest request) {
        return appraisalService.createCycle(request);
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAuthority('APPRAISAL_MANAGE')")
    public AppraisalCycleResponse close(@PathVariable Long id) {
        return appraisalService.closeCycle(id);
    }
}
