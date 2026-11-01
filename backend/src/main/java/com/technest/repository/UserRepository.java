package com.technest.repository;

import com.technest.entity.User;
import com.technest.enums.Role;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(Role role);

    @Query("select u from User u where u.role = :role and (lower(u.fullName) like :q or lower(u.email) like :q)")
    Page<User> search(@Param("role") Role role, @Param("q") String q, Pageable pageable);
}
