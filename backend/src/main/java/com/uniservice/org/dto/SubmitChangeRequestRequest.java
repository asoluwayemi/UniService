package com.uniservice.org.dto;

import com.uniservice.org.entity.ChangeRequestAction;
import com.uniservice.org.entity.OrgUnitType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitChangeRequestRequest {

    @NotNull
    private ChangeRequestAction action;

    private Long targetOrgUnitId;
    private String proposedName;
    private String proposedCode;
    private OrgUnitType proposedType;
    private Long proposedParentId;
    private Long proposedHeadId;
    private Boolean proposedIsHrUnit;
}
