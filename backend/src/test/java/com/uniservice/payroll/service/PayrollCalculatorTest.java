package com.uniservice.payroll.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PayrollCalculatorTest {

    private final PayrollCalculator calculator = new PayrollCalculator(
            new BigDecimal("0.25"), new BigDecimal("0.15"), new BigDecimal("0.08"), new BigDecimal("0.07"));

    @Test
    void calculatesBreakdownFromBasic() {
        PayrollCalculator.Breakdown b = calculator.calculate(new BigDecimal("100000"));

        assertThat(b.basic()).isEqualByComparingTo("100000.00");
        assertThat(b.housing()).isEqualByComparingTo("25000.00");
        assertThat(b.transport()).isEqualByComparingTo("15000.00");
        assertThat(b.gross()).isEqualByComparingTo("140000.00");
        assertThat(b.pension()).isEqualByComparingTo("8000.00");
        assertThat(b.tax()).isEqualByComparingTo("9800.00");
        assertThat(b.net()).isEqualByComparingTo("122200.00");
    }

    @Test
    void roundsToTwoDecimalPlaces() {
        PayrollCalculator.Breakdown b = calculator.calculate(new BigDecimal("33333.33"));

        assertThat(b.housing().scale()).isEqualTo(2);
        assertThat(b.net()).isEqualByComparingTo(
                b.gross().subtract(b.pension()).subtract(b.tax()));
    }
}
