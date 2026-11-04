package com.uniservice.recruitment.entity;

import java.util.Set;

public enum ApplicationStage {
    APPLIED, SHORTLISTED, INTERVIEW, OFFERED, HIRED, REJECTED;

    /** The pipeline moves forward one step at a time; any live stage may be rejected; HIRED and REJECTED are final. */
    public Set<ApplicationStage> next() {
        return switch (this) {
            case APPLIED -> Set.of(SHORTLISTED, REJECTED);
            case SHORTLISTED -> Set.of(INTERVIEW, REJECTED);
            case INTERVIEW -> Set.of(OFFERED, REJECTED);
            case OFFERED -> Set.of(HIRED, REJECTED);
            case HIRED, REJECTED -> Set.of();
        };
    }
}
