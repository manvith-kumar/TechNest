package com.technest.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.technest.enums.*;

@Entity(name = "PurchaseOrder")   // 'Order' is a reserved word in HQL
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@BatchSize(size = 50)
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, length = 30, unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PLACED;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountTotal = BigDecimal.ZERO;

    @Column(name = "shipping_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "ship_name", nullable = false, length = 120)
    private String shipName;
    @Column(name = "ship_phone", nullable = false, length = 20)
    private String shipPhone;
    @Column(name = "ship_line1", nullable = false, length = 200)
    private String shipLine1;
    @Column(name = "ship_line2", length = 200)
    private String shipLine2;
    @Column(name = "ship_city", nullable = false, length = 100)
    private String shipCity;
    @Column(name = "ship_state", nullable = false, length = 100)
    private String shipState;
    @Column(name = "ship_postal", nullable = false, length = 12)
    private String shipPostal;
    @Column(name = "ship_country", nullable = false, length = 80)
    private String shipCountry;

    @Column(name = "idempotency_key", length = 80)
    private String idempotencyKey;

    /** Guards against restoring stock twice for the same cancelled order. */
    @Column(name = "stock_restored", nullable = false)
    private boolean stockRestored;

    @CreationTimestamp
    @Column(name = "placed_at", nullable = false, updatable = false)
    private LocalDateTime placedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @BatchSize(size = 50)
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<Payment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC, id ASC")
    @BatchSize(size = 50)
    private List<OrderStatusHistory> history = new ArrayList<>();

    public Payment getPayment() {
        return payments.isEmpty() ? null : payments.get(0);
    }

    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }

    public void attachPayment(Payment payment) {
        payment.setOrder(this);
        payments.add(payment);
    }

    public void recordStatus(OrderStatus next, String note, Long changedBy) {
        OrderStatusHistory h = new OrderStatusHistory();
        h.setOrder(this);
        h.setStatus(next);
        h.setNote(note);
        h.setChangedBy(changedBy);
        history.add(h);
        this.status = next;
    }
}
