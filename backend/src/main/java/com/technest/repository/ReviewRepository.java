package com.technest.repository;

import com.technest.entity.Review;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByProductId(Long productId, Pageable pageable);

    Page<Review> findByReported(boolean reported, Pageable pageable);

    Optional<Review> findByUserIdAndProductId(Long userId, Long productId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    long countByProductId(Long productId);

    @Query("select r.product.id from Review r where r.user.id = :uid and r.product.id in :pids")
    List<Long> findReviewedProductIds(@Param("uid") Long userId, @Param("pids") java.util.Collection<Long> productIds);

    @Query("select avg(r.rating) from Review r where r.product.id = :pid")
    Double averageRating(@Param("pid") Long productId);

    @Query("select r.rating, count(r) from Review r where r.product.id = :pid group by r.rating")
    List<Object[]> ratingDistribution(@Param("pid") Long productId);
}
