package com.technest.repository;

import com.technest.entity.Category;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByNameIgnoreCase(String name);

    Optional<Category> findByNameIgnoreCase(String name);

    boolean existsBySlug(String slug);

    List<Category> findAllByOrderByNameAsc();
}
