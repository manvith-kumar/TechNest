package com.technest.dto;

import com.technest.dto.CartDtos.AddressDto;
import com.technest.dto.OrderDtos.OrderDto;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class AdminDtos {
    private AdminDtos() {}

    public record MonthlySalesPoint(String month, BigDecimal revenue, long orders) {}
    public record StatusCount(String status, long count) {}
    public record CategorySales(String category, BigDecimal sales) {}
    public record TopProduct(Long productId, String name, long unitsSold, BigDecimal revenue) {}
    public record LowStockItem(Long productId, String name, String imageUrl, int stockQuantity, int threshold) {}
    public record GrowthPoint(String month, long newCustomers) {}
    public record PaymentSplit(String method, long orders, BigDecimal amount) {}
    public record InventoryStatus(long inStock, long lowStock, long outOfStock, long total) {}

    public record DashboardDto(BigDecimal totalRevenue, long totalOrders, long totalCustomers, long totalProducts,
                               long pendingOrders, long deliveredOrders, long lowStockCount, long outOfStockCount,
                               List<MonthlySalesPoint> monthlySales, List<StatusCount> orderStatusCounts,
                               List<CategorySales> categorySales, List<TopProduct> topProducts,
                               List<OrderDto> recentOrders, List<LowStockItem> lowStockProducts) {}

    public record ReportDto(LocalDate from, LocalDate to, BigDecimal totalSales, long totalOrders,
                            BigDecimal averageOrderValue, List<MonthlySalesPoint> monthlyRevenue,
                            List<TopProduct> topProducts, List<CategorySales> topCategories,
                            List<GrowthPoint> customerGrowth, InventoryStatus inventory, List<PaymentSplit> paymentSplit,
                            List<StatusCount> orderStatusCounts) {}

    public record CustomerDto(Long id, String fullName, String email, String phone, boolean enabled,
                              LocalDateTime createdAt, long orderCount, BigDecimal totalSpent) {}

    public record CustomerDetailDto(CustomerDto customer, List<AddressDto> addresses, List<OrderDto> recentOrders) {}

    public record UpdateCustomerStatusRequest(@NotNull Boolean enabled) {}

    public record UploadResponse(String url) {}
}
