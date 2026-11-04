package com.uniservice.payroll.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Pure payroll arithmetic. Rates are fractions of basic (allowances, pension) or of gross (tax) and come from
 * configuration; the defaults are placeholders that Finance must confirm.
 */
@Component
public class PayrollCalculator {

    public record Breakdown(BigDecimal basic, BigDecimal housing, BigDecimal transport, BigDecimal gross,
                            BigDecimal pension, BigDecimal tax, BigDecimal net) {
    }

    private final BigDecimal housingRate;
    private final BigDecimal transportRate;
    private final BigDecimal pensionRate;
    private final BigDecimal taxRate;

    public PayrollCalculator(
            @Value("${app.payroll.housing-rate:0.25}") BigDecimal housingRate,
            @Value("${app.payroll.transport-rate:0.15}") BigDecimal transportRate,
            @Value("${app.payroll.pension-rate:0.08}") BigDecimal pensionRate,
            @Value("${app.payroll.tax-rate:0.07}") BigDecimal taxRate) {
        this.housingRate = housingRate;
        this.transportRate = transportRate;
        this.pensionRate = pensionRate;
        this.taxRate = taxRate;
    }

    public Breakdown calculate(BigDecimal basicMonthly) {
        BigDecimal basic = money(basicMonthly);
        BigDecimal housing = money(basic.multiply(housingRate));
        BigDecimal transport = money(basic.multiply(transportRate));
        BigDecimal gross = basic.add(housing).add(transport);
        BigDecimal pension = money(basic.multiply(pensionRate));
        BigDecimal tax = money(gross.multiply(taxRate));
        BigDecimal net = gross.subtract(pension).subtract(tax);
        return new Breakdown(basic, housing, transport, gross, pension, tax, net);
    }

    private static BigDecimal money(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }
}
