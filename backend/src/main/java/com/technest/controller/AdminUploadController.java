package com.technest.controller;

import com.technest.dto.AdminDtos.UploadResponse;
import com.technest.service.FileStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/uploads")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUploadController {
    private final FileStorageService storage;

    public AdminUploadController(FileStorageService storage) {
        this.storage = storage;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse upload(@RequestParam("file") MultipartFile file) {
        return new UploadResponse(storage.storeImage(file));
    }
}
