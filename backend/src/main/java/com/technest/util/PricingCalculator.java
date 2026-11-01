
package com.technest.util;

import com.technest.config.AppProperties;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * The single place where cart and order totals are computed, always from server-side prices.
 * Product prices are tax-inclusive in this project.
 */
@Component
public class PricingCalculator {

    public record Quote(
            BigDecimal subtotal,
            BigDecimal savings,
            BigDecimal shippingFee,
            BigDecimal total
    ) {}

    private final BigDecimal freeThreshold;
    private final BigDecimal flatFee;

    @Autowired
    public PricingCalculator(AppProperties props) {
        this(props.shipping().freeThreshold(), props.shipping().flatFee());
    }

    public PricingCalculator(BigDecimal freeThreshold, BigDecimal flatFee) {
        this.freeThreshold = freeThreshold;
        this.flatFee = flatFee;
    }

    public BigDecimal lineTotal(BigDecimal unitPrice, int quantity) {
        return unitPrice.multiply(BigDecimal.valueOf(quantity))
                .setScale(2, RoundingMode.HALF_UP);
    }

    public Quote quote(BigDecimal subtotal, BigDecimal savings) {
        BigDecimal sub = subtotal.setScale(2, RoundingMode.HALF_UP);

        BigDecimal ship = (sub.signum() == 0 || sub.compareTo(freeThreshold) >= 0)
                ? BigDecimal.ZERO.setScale(2)
                : flatFee.setScale(2, RoundingMode.HALF_UP);

        return new Quote(
                sub,
                savings.setScale(2, RoundingMode.HALF_UP),
                ship,
                sub.add(ship)
        );
    }

    public BigDecimal getFlatFee() {
        return flatFee;
    }

    public BigDecimal getFreeThreshold() {
        return freeThreshold;
    }
}
