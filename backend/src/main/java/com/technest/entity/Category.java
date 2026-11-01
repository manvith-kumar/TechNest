package com.technest.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.technest.enums.*;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@BatchSize(size = 50)
public class Category extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String name;

    @Column(nullable = false, length = 120, unique = true)
    private String slug;

    @Column(length = 500)
    private String description;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;
}
