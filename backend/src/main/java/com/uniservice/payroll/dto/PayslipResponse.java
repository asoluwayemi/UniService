package com.uniservice.payroll.dto;

import com.uniservice.payroll.entity.Payslip;

import java.math.BigDecimal;

public record PayslipResponse(Long id, String period, String staffNumber, String fullName, int gradeLevel,
                              BigDecimal basic, BigDecimal housing, BigDecimal transport, BigDecimal gross,
                              BigDecimal pension, BigDecimal tax, BigDecimal net, String bankName, String accountLast4) {
    public static PayslipResponse from(Payslip p) {
        return new PayslipResponse(p.getId(), p.getRun().getPeriod(), p.getStaffNumber(), p.getFullName(),
                p.getGradeLevel(), p.getBasic(), p.getHousing(), p.getTransport(), p.getGross(), p.getPension(),
                p.getTax(), p.getNet(), p.getBankName(), p.getAccountLast4());
    }
}
