package com.technest.repository;

import com.technest.entity.Category;
import com.technest.entity.Product;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByIdAndActiveTrue(Long id);

    List<Product> findByIdIn(Collection<Long> ids);

    boolean existsBySlug(String slug);

    long countByCategoryId(Long categoryId);

    long countByActiveTrue();

    @Query("select distinct p.brand from Product p where p.active = true order by p.brand")
    List<String> findActiveBrands();

    @Query("select p.category.id, count(p) from Product p group by p.category.id")
    List<Object[]> countGroupedByCategory();

    @Query("select count(p) from Product p where p.active = true and p.stockQuantity > 0 and p.stockQuantity <= p.lowStockThreshold")
    long countLowStock();

    @Query("select count(p) from Product p where p.active = true and p.stockQuantity = 0")
    long countOutOfStock();

    @Query("select p from Product p where p.active = true and p.stockQuantity <= p.lowStockThreshold order by p.stockQuantity asc, p.name asc")
    List<Product> findLowStock(Pageable pageable);

    // ---- Stock-sensitive operations: single atomic UPDATE statements, never read-modify-write. ----

    /** Returns 0 rows when there is not enough stock, so inventory can never go negative. */
    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.stockQuantity = p.stockQuantity - :qty where p.id = :id and p.stockQuantity >= :qty")
    int decrementStock(@Param("id") Long id, @Param("qty") int qty);

    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.stockQuantity = p.stockQuantity + :qty where p.id = :id")
    int incrementStock(@Param("id") Long id, @Param("qty") int qty);

    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.soldCount = p.soldCount + :qty where p.id = :id")
    int incrementSold(@Param("id") Long id, @Param("qty") int qty);

    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.soldCount = case when p.soldCount >= :qty then p.soldCount - :qty else 0 end where p.id = :id")
    int decrementSold(@Param("id") Long id, @Param("qty") int qty);

    @Query("select p.stockQuantity from Product p where p.id = :id")
    Integer findStock(@Param("id") Long id);

    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.ratingAvg = :avg, p.ratingCount = :cnt where p.id = :id")
    int updateRating(@Param("id") Long id, @Param("avg") BigDecimal avg, @Param("cnt") int cnt);

    @Modifying(flushAutomatically = true)
    @Query("update Product p set p.category = :target where p.category = :source")
    int reassignCategory(@Param("source") Category source, @Param("target") Category target);
}
