package com.technest.repository;

import com.technest.entity.Order;
import com.technest.entity.User;
import com.technest.enums.OrderStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

public final class OrderSpecs {
    private OrderSpecs() {}

    public static Specification<Order> admin(OrderStatus status, String q, LocalDateTime from, LocalDateTime toExclusive) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (status != null) ps.add(cb.equal(root.<OrderStatus>get("status"), status));
            if (q != null && !q.isBlank()) {
                Join<Order, User> user = root.join("user", JoinType.LEFT);
                String like = "%" + q.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                ps.add(cb.or(cb.like(cb.lower(root.<String>get("orderNumber")), like, '\\'),
                        cb.like(cb.lower(user.<String>get("email")), like, '\\'),
                        cb.like(cb.lower(user.<String>get("fullName")), like, '\\')));
            }
            if (from != null) ps.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("placedAt"), from));
            if (toExclusive != null) ps.add(cb.lessThan(root.<LocalDateTime>get("placedAt"), toExclusive));
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }
}
