package com.uniservice.staff.dto;

import com.uniservice.staff.entity.StaffProfile;

public record StaffColleagueResponse(Long id, Long userId, String firstName, String lastName, String staffNumber) {
    public static StaffColleagueResponse from(StaffProfile p) {
        return new StaffColleagueResponse(
                p.getId(), p.getUser().getId(), p.getUser().getFirstName(), p.getUser().getLastName(), p.getStaffNumber());
    }
}
