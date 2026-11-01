package com.technest.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    /** Validates and stores an image, returning its public URL path (e.g. /uploads/abc.jpg). */
    String storeImage(MultipartFile file);
}
