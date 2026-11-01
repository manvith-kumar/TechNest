package com.technest.mapper;

import com.technest.dto.AuthDtos.UserDto;
import com.technest.dto.CartDtos.AddressDto;
import com.technest.dto.CatalogDtos.*;
import com.technest.dto.OrderDtos.*;
import com.technest.dto.ReviewDtos.ReviewDto;
import com.technest.entity.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;

/** Entities never leave the service layer: everything the API returns is mapped here. */
@Component
public class EntityMapper {

    public UserDto toUserDto(User u) {
        return new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole(), u.isEnabled(), u.getCreatedAt());
    }

    public CategoryDto toCategoryDto(Category c, long productCount) {
        return new CategoryDto(c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getImageUrl(), productCount);
    }

    private String primaryImage(Product p) {
        return p.getImages().isEmpty() ? null : p.getImages().get(0).getUrl();
    }

    private int discountPercent(Product p) {
        if (p.getDiscountPrice() == null || p.getPrice().signum() == 0) return 0;
        return p.getPrice().subtract(p.getDiscountPrice()).multiply(BigDecimal.valueOf(100))
                .divide(p.getPrice(), 0, RoundingMode.HALF_UP).intValue();
    }

    private boolean isLow(Product p) {
        return p.getStockQuantity() > 0 && p.getStockQuantity() <= p.getLowStockThreshold();
    }

    public ProductSummary toSummary(Product p) {
        return new ProductSummary(p.getId(), p.getName(), p.getSlug(), p.getBrand(), p.getCategory().getId(),
                p.getCategory().getName(), primaryImage(p), p.getPrice(), p.getDiscountPrice(), p.currentPrice(),
                discountPercent(p), p.getRatingAvg(), p.getRatingCount(), p.getStockQuantity(), p.getStockQuantity() > 0,
                isLow(p), p.isFeatured(), p.isActive(), p.getSoldCount());
    }

    public ProductDetail toDetail(Product p) {
        List<ImageDto> images = p.getImages().stream().map(i -> new ImageDto(i.getUrl(), i.getAltText())).toList();
        List<SpecDto> specs = p.getSpecifications().stream().map(s -> new SpecDto(s.getSpecKey(), s.getSpecValue())).toList();
        return new ProductDetail(p.getId(), p.getName(), p.getSlug(), p.getBrand(), p.getCategory().getId(),
                p.getCategory().getName(), p.getDescription(), p.getPrice(), p.getDiscountPrice(), p.currentPrice(),
                discountPercent(p), p.getRatingAvg(), p.getRatingCount(), p.getStockQuantity(), p.getLowStockThreshold(),
                p.getStockQuantity() > 0, isLow(p), p.isFeatured(), p.isActive(), p.getSoldCount(), images, specs,
                p.getCreatedAt());
    }

    public AddressDto toAddressDto(Address a) {
        return new AddressDto(a.getId(), a.getLabel(), a.getRecipientName(), a.getPhone(), a.getLine1(), a.getLine2(),
                a.getCity(), a.getState(), a.getPostalCode(), a.getCountry(), a.isDefaultAddress());
    }

    public ReviewDto toReviewDto(Review r) {
        return new ReviewDto(r.getId(), r.getProduct().getId(), r.getProduct().getName(), r.getUser().getId(),
                r.getUser().getFullName(), r.getRating(), r.getTitle(), r.getComment(), r.isReported(), r.getCreatedAt(),
                r.getUpdatedAt());
    }

    public OrderDto toOrderDto(Order o, Set<Long> reviewedProductIds) {
        List<OrderItemDto> items = o.getItems().stream().map(i -> new OrderItemDto(i.getId(), i.getProduct().getId(),
                i.getProductName(), i.getProductImage(), i.getUnitPrice(), i.getOriginalPrice(), i.getQuantity(),
                i.getLineTotal(), reviewedProductIds.contains(i.getProduct().getId()))).toList();
        Payment p = o.getPayment();
        PaymentDto payment = p == null ? null : new PaymentDto(p.getId(), p.getMethod(), p.getStatus(), p.getAmount(),
                p.getTransactionRef(), p.isSimulated(), p.getPaidAt());
        List<StatusHistoryDto> history = o.getHistory().stream()
                .map(h -> new StatusHistoryDto(h.getStatus(), h.getNote(), h.getCreatedAt())).toList();
        ShippingAddressDto ship = new ShippingAddressDto(o.getShipName(), o.getShipPhone(), o.getShipLine1(), o.getShipLine2(),
                o.getShipCity(), o.getShipState(), o.getShipPostal(), o.getShipCountry());
        User u = o.getUser();
        OrderCustomerDto customer = new OrderCustomerDto(u.getId(), u.getFullName(), u.getEmail(), u.getPhone());
        return new OrderDto(o.getId(), o.getOrderNumber(), o.getStatus(), o.getSubtotal(), o.getDiscountTotal(),
                o.getShippingFee(), o.getTotalAmount(), o.getPlacedAt(), o.getUpdatedAt(), ship, items, payment, history,
                o.getStatus().isCustomerCancellable(), new ArrayList<>(o.getStatus().allowedNext()), customer);
    }
}
