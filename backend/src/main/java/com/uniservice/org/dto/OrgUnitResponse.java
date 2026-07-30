package com.uniservice.org.dto;

import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.entity.OrgUnitStatus;
import com.uniservice.org.entity.OrgUnitType;

public record OrgUnitResponse(
        Long id,
        String name,
        String code,
        OrgUnitType type,
        Long parentId,
        Long headId,
        String headName,
        OrgUnitStatus status
) {
    public static OrgUnitResponse from(OrgUnit unit) {
        return new OrgUnitResponse(
                unit.getId(),
                unit.getName(),
                unit.getCode(),
                unit.getType(),
                unit.getParent() != null ? unit.getParent().getId() : null,
                unit.getHead() != null ? unit.getHead().getId() : null,
                unit.getHead() != null ? unit.getHead().getFirstName() + " " + unit.getHead().getLastName() : null,
                unit.getStatus()
        );
    }
}
