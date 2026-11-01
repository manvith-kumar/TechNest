package com.technest.unit;

import static org.junit.jupiter.api.Assertions.*;

import com.technest.enums.OrderStatus;
import org.junit.jupiter.api.Test;

class OrderStatusTest {
    @Test
    void allowsOnlyForwardTransitions() {
        assertTrue(OrderStatus.PLACED.canTransitionTo(OrderStatus.CONFIRMED));
        assertTrue(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.SHIPPED));
        assertTrue(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.DELIVERED));
        assertFalse(OrderStatus.PLACED.canTransitionTo(OrderStatus.SHIPPED));
        assertFalse(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.PLACED));
    }

    @Test
    void terminalStatesHaveNoTransitions() {
        for (OrderStatus s : new OrderStatus[] {OrderStatus.DELIVERED, OrderStatus.CANCELLED}) {
            assertTrue(s.isTerminal());
            assertTrue(s.allowedNext().isEmpty());
        }
    }

    @Test
    void cannotCancelOnceShipped() {
        assertFalse(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.CANCELLED));
        assertTrue(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.CANCELLED));
    }

    @Test
    void customersCanCancelOnlyEarly() {
        assertTrue(OrderStatus.PLACED.isCustomerCancellable());
        assertTrue(OrderStatus.CONFIRMED.isCustomerCancellable());
        assertFalse(OrderStatus.PROCESSING.isCustomerCancellable());
        assertFalse(OrderStatus.DELIVERED.isCustomerCancellable());
    }
}
