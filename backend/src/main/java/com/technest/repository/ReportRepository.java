package com.technest.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Repository;

/**
 * Aggregations over real order data. Revenue excludes CANCELLED orders.
 * Each method returns raw rows; ReportService converts them to DTOs.
 */
@Repository
public class ReportRepository {

    @PersistenceContext
    private EntityManager em;

    @SuppressWarnings("unchecked")
    private List<Object[]> rows(String sql, LocalDateTime from, LocalDateTime to, Integer limit) {
        Query q = em.createNativeQuery(sql);
        q.setParameter("fromTs", from);
        q.setParameter("toTs", to);
        if (limit != null) q.setParameter("lim", limit);
        return q.getResultList();
    }

    /** month, revenue, orders */
    public List<Object[]> monthlySales(LocalDateTime from, LocalDateTime to) {
        return rows("SELECT DATE_FORMAT(o.placed_at, '%Y-%m'), COALESCE(SUM(o.total_amount), 0), COUNT(*) "
                + "FROM orders o WHERE o.status <> 'CANCELLED' AND o.placed_at >= :fromTs AND o.placed_at < :toTs "
                + "GROUP BY DATE_FORMAT(o.placed_at, '%Y-%m') ORDER BY 1", from, to, null);
    }

    /** category, sales */
    public List<Object[]> categorySales(LocalDateTime from, LocalDateTime to, int limit) {
        return rows("SELECT c.name, COALESCE(SUM(oi.line_total), 0) "
                + "FROM order_items oi JOIN orders o ON o.id = oi.order_id "
                + "JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id "
                + "WHERE o.status <> 'CANCELLED' AND o.placed_at >= :fromTs AND o.placed_at < :toTs "
                + "GROUP BY c.id, c.name ORDER BY 2 DESC LIMIT :lim", from, to, limit);
    }

    /** product id, name, units, revenue */
    public List<Object[]> topProducts(LocalDateTime from, LocalDateTime to, int limit) {
        return rows("SELECT p.id, p.name, SUM(oi.quantity), SUM(oi.line_total) "
                + "FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id "
                + "WHERE o.status <> 'CANCELLED' AND o.placed_at >= :fromTs AND o.placed_at < :toTs "
                + "GROUP BY p.id, p.name ORDER BY 3 DESC, 4 DESC LIMIT :lim", from, to, limit);
    }

    /** status, count */
    public List<Object[]> orderStatusCounts(LocalDateTime from, LocalDateTime to) {
        return rows("SELECT o.status, COUNT(*) FROM orders o WHERE o.placed_at >= :fromTs AND o.placed_at < :toTs "
                + "GROUP BY o.status ORDER BY 2 DESC", from, to, null);
    }

    /** month, new customers */
    public List<Object[]> customerGrowth(LocalDateTime from, LocalDateTime to) {
        return rows("SELECT DATE_FORMAT(u.created_at, '%Y-%m'), COUNT(*) FROM users u "
                + "WHERE u.role = 'CUSTOMER' AND u.created_at >= :fromTs AND u.created_at < :toTs "
                + "GROUP BY DATE_FORMAT(u.created_at, '%Y-%m') ORDER BY 1", from, to, null);
    }

    /** method, orders, amount */
    public List<Object[]> paymentSplit(LocalDateTime from, LocalDateTime to) {
        return rows("SELECT pay.method, COUNT(*), COALESCE(SUM(pay.amount), 0) "
                + "FROM payments pay JOIN orders o ON o.id = pay.order_id "
                + "WHERE o.status <> 'CANCELLED' AND o.placed_at >= :fromTs AND o.placed_at < :toTs "
                + "GROUP BY pay.method ORDER BY 2 DESC", from, to, null);
    }

    /** total revenue, order count */
    public List<Object[]> totals(LocalDateTime from, LocalDateTime to) {
        return rows("SELECT COALESCE(SUM(o.total_amount), 0), COUNT(*) FROM orders o "
                + "WHERE o.status <> 'CANCELLED' AND o.placed_at >= :fromTs AND o.placed_at < :toTs", from, to, null);
    }
}
