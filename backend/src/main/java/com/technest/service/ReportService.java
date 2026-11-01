package com.technest.service;

import com.technest.dto.AdminDtos.DashboardDto;
import com.technest.dto.AdminDtos.ReportDto;
import java.time.LocalDate;

public interface ReportService {
    DashboardDto dashboard();

    ReportDto report(LocalDate from, LocalDate to);
}
