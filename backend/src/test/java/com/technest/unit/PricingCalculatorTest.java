package com.technest.unit;

import static org.junit.jupiter.api.Assertions.*;

import com.technest.util.PricingCalculator;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class PricingCalculatorTest {
    private final PricingCalculator calc = new PricingCalculator(new BigDecimal("5000"), new BigDecimal("99"));

    @Test
    void chargesShippingBelowThreshold() {
        PricingCalculator.Quote q = calc.quote(new BigDecimal("1999.00"), new BigDecimal("500"));
        assertEquals(new BigDecimal("99.00"), q.shippingFee());
        assertEquals(new BigDecimal("2098.00"), q.total());
    }

    @Test
    void freeShippingAtOrAboveThreshold() {
        assertEquals(0, calc.quote(new BigDecimal("5000.00"), BigDecimal.ZERO).shippingFee().signum());
        assertEquals(new BigDecimal("7000.00"), calc.quote(new BigDecimal("7000.00"), BigDecimal.ZERO).total());
    }

    @Test
    void emptyCartHasNoShipping() {
        assertEquals(0, calc.quote(BigDecimal.ZERO, BigDecimal.ZERO).total().signum());
    }

    @Test
    void lineTotalUsesExactDecimalArithmetic() {
        assertEquals(new BigDecimal("59.97"), calc.lineTotal(new BigDecimal("19.99"), 3));
    }
}
