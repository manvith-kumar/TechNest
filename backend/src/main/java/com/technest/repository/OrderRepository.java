package com.technest.repository;

import com.technest.entity.Order;
import com.technest.enums.OrderStatus;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    Page<Order> findByUserId(Long userId, Pageable pageable);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    Optional<Order> findByUserIdAndIdempotencyKey(Long userId, String idempotencyKey);

    boolean existsByOrderNumber(String orderNumber);

    long countByStatus(OrderStatus status);

    long countByStatusIn(Collection<OrderStatus> statuses);

    long countByUserId(Long userId);

    /** Row lock used for status changes and cancellations so concurrent requests cannot restore stock twice. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from PurchaseOrder o where o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);

    @Query("select coalesce(sum(o.totalAmount), 0) from PurchaseOrder o where o.status <> :excluded")
    BigDecimal sumRevenueExcluding(@Param("excluded") OrderStatus excluded);

    @Query("select coalesce(sum(o.totalAmount), 0) from PurchaseOrder o where o.user.id = :uid and o.status <> :excluded")
    BigDecimal sumSpentByUser(@Param("uid") Long userId, @Param("excluded") OrderStatus excluded);

    List<Order> findTop6ByOrderByPlacedAtDesc();
}
