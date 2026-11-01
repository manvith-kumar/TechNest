package com.technest.enums;

import java.util.EnumSet;
import java.util.Set;

public enum OrderStatus {
    PLACED, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED;

    /** Valid forward transitions. DELIVERED and CANCELLED are terminal. */
    public Set<OrderStatus> allowedNext() {
        switch (this) {
            case PLACED:     return EnumSet.of(CONFIRMED, CANCELLED);
            case CONFIRMED:  return EnumSet.of(PROCESSING, CANCELLED);
            case PROCESSING: return EnumSet.of(SHIPPED, CANCELLED);
            case SHIPPED:    return EnumSet.of(DELIVERED);
            default:         return EnumSet.noneOf(OrderStatus.class);
        }
    }

    public boolean canTransitionTo(OrderStatus target) {
        return allowedNext().contains(target);
    }

    public boolean isTerminal() {
        return this == DELIVERED || this == CANCELLED;
    }

    /** Customers may cancel only before the order starts processing. */
    public boolean isCustomerCancellable() {
        return this == PLACED || this == CONFIRMED;
    }

    /** Orders that still need admin attention. */
    public boolean isPending() {
        return this == PLACED || this == CONFIRMED || this == PROCESSING;
    }
}
