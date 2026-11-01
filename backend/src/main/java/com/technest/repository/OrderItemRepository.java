package com.technest.repository;

import com.technest.entity.OrderItem;
import com.technest.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    boolean existsByProductId(Long productId);

    @Query("select count(oi) from OrderItem oi where oi.order.user.id = :uid and oi.product.id = :pid and oi.order.status = :status")
    long countPurchases(@Param("uid") Long userId, @Param("pid") Long productId, @Param("status") OrderStatus status);
}
