package com.technest.service.impl;

import com.technest.dto.AdminDtos.*;
import com.technest.entity.Product;
import com.technest.enums.OrderStatus;
import com.technest.enums.Role;
import com.technest.exception.BadRequestException;
import com.technest.mapper.EntityMapper;
import com.technest.repository.OrderRepository;
import com.technest.repository.ProductRepository;
import com.technest.repository.ReportRepository;
import com.technest.repository.UserRepository;
import com.technest.service.ReportService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Every figure comes from aggregate queries over live data; nothing is hard-coded. */
@Service
public class ReportServiceImpl implements ReportService {
    private static final LocalDateTime EPOCH = LocalDateTime.of(2000, 1, 1, 0, 0);

    private final ReportRepository reports;
    private final OrderRepository orders;
    private final ProductRepository products;
    private final UserRepository users;
    private final EntityMapper mapper;

    public ReportServiceImpl(ReportRepository reports, OrderRepository orders, ProductRepository products,
                             UserRepository users, EntityMapper mapper) {
        this.reports = reports;
        this.orders = orders;
        this.products = products;
        this.users = users;
        this.mapper = mapper;
    }

    private static BigDecimal dec(Object o) {
        return o == null ? BigDecimal.ZERO : new BigDecimal(o.toString());
    }

    private static long lng(Object o) {
        return o == null ? 0 : ((Number) o).longValue();
    }

    private List<MonthlySalesPoint> monthly(LocalDateTime from, LocalDateTime to, YearMonth first, YearMonth last) {
        Map<String, MonthlySalesPoint> byMonth = new HashMap<>();
        for (Object[] r : reports.monthlySales(from, to)) {
            byMonth.put((String) r[0], new MonthlySalesPoint((String) r[0], dec(r[1]), lng(r[2])));
        }
        List<MonthlySalesPoint> out = new ArrayList<>();   // fill gaps so charts show empty months as zero
        for (YearMonth m = first; !m.isAfter(last); m = m.plusMonths(1)) {
            out.add(byMonth.getOrDefault(m.toString(), new MonthlySalesPoint(m.toString(), BigDecimal.ZERO, 0)));
        }
        return out;
    }

    private List<TopProduct> top(LocalDateTime from, LocalDateTime to, int limit) {
        List<TopProduct> out = new ArrayList<>();
        for (Object[] r : reports.topProducts(from, to, limit)) out.add(new TopProduct(lng(r[0]), (String) r[1], lng(r[2]), dec(r[3])));
        return out;
    }

    private List<CategorySales> categories(LocalDateTime from, LocalDateTime to, int limit) {
        List<CategorySales> out = new ArrayList<>();
        for (Object[] r : reports.categorySales(from, to, limit)) out.add(new CategorySales((String) r[0], dec(r[1])));
        return out;
    }

    private List<StatusCount> statuses(LocalDateTime from, LocalDateTime to) {
        List<StatusCount> out = new ArrayList<>();
        for (Object[] r : reports.orderStatusCounts(from, to)) out.add(new StatusCount((String) r[0], lng(r[1])));
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardDto dashboard() {
        YearMonth thisMonth = YearMonth.now();
        YearMonth first = thisMonth.minusMonths(5);
        LocalDateTime from = first.atDay(1).atStartOfDay();
        LocalDateTime to = LocalDate.now().plusDays(1).atStartOfDay();
        List<LowStockItem> low = new ArrayList<>();
        for (Product p : products.findLowStock(PageRequest.of(0, 8))) {
            low.add(new LowStockItem(p.getId(), p.getName(), p.getImages().isEmpty() ? null : p.getImages().get(0).getUrl(),
                    p.getStockQuantity(), p.getLowStockThreshold()));
        }
        return new DashboardDto(
                orders.sumRevenueExcluding(OrderStatus.CANCELLED), orders.count(), users.countByRole(Role.CUSTOMER),
                products.count(),
                orders.countByStatusIn(List.of(OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.PROCESSING)),
                orders.countByStatus(OrderStatus.DELIVERED), products.countLowStock(), products.countOutOfStock(),
                monthly(from, to, first, thisMonth), statuses(EPOCH, to), categories(from, to, 6), top(from, to, 5),
                orders.findTop6ByOrderByPlacedAtDesc().stream().map(o -> mapper.toOrderDto(o, Set.of())).toList(), low);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportDto report(LocalDate from, LocalDate to) {
        LocalDate end = to == null ? LocalDate.now() : to;
        LocalDate start = from == null ? YearMonth.from(end).minusMonths(5).atDay(1) : from;
        if (start.isAfter(end)) throw new BadRequestException("The start date must be on or before the end date.");
        if (start.plusYears(3).isBefore(end)) throw new BadRequestException("Choose a range of 3 years or less.");
        LocalDateTime f = start.atStartOfDay();
        LocalDateTime t = end.plusDays(1).atStartOfDay();

        Object[] totals = reports.totals(f, t).get(0);
        BigDecimal sales = dec(totals[0]);
        long orderCount = lng(totals[1]);
        BigDecimal aov = orderCount == 0 ? BigDecimal.ZERO : sales.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP);

        List<GrowthPoint> growth = new ArrayList<>();
        for (Object[] r : reports.customerGrowth(f, t)) growth.add(new GrowthPoint((String) r[0], lng(r[1])));
        List<PaymentSplit> split = new ArrayList<>();
        for (Object[] r : reports.paymentSplit(f, t)) split.add(new PaymentSplit((String) r[0], lng(r[1]), dec(r[2])));

        long low = products.countLowStock();
        long out = products.countOutOfStock();
        long total = products.countByActiveTrue();
        InventoryStatus inventory = new InventoryStatus(Math.max(total - low - out, 0), low, out, total);

        return new ReportDto(start, end, sales, orderCount, aov,
                monthly(f, t, YearMonth.from(start), YearMonth.from(end)), top(f, t, 10), categories(f, t, 8), growth,
                inventory, split, statuses(f, t));
    }
}
