package com.technest.controller;

import com.technest.dto.AdminDtos.DashboardDto;
import com.technest.dto.AdminDtos.ReportDto;
import com.technest.service.ReportService;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {
    private final ReportService reports;

    public AdminDashboardController(ReportService reports) {
        this.reports = reports;
    }

    @GetMapping("/dashboard")
    public DashboardDto dashboard() {
        return reports.dashboard();
    }

    @GetMapping("/reports")
    public ReportDto report(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reports.report(from, to);
    }
}
