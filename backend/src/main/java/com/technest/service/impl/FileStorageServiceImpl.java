package com.technest.service.impl;

import com.technest.config.AppProperties;
import com.technest.exception.BadRequestException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.technest.service.FileStorageService;

@Service
public class FileStorageServiceImpl implements FileStorageService {
    private static final Map<String, String> TYPES = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "image/gif", "gif");

    private final Path root;

    public FileStorageServiceImpl(AppProperties props) {
        this.root = Path.of(props.upload().dir()).toAbsolutePath().normalize();
    }

    @Override
    public String storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BadRequestException("Choose an image to upload.");
        String ext = TYPES.get(file.getContentType());
        if (ext == null) throw new BadRequestException("Only JPEG, PNG, WebP or GIF images are allowed.");
        try {
            byte[] head = new byte[12];
            try (InputStream in = file.getInputStream()) {
                if (in.readNBytes(head, 0, 12) < 12 || !signatureMatches(head, ext)) {
                    throw new BadRequestException("The file content does not match an allowed image type.");
                }
            }
            Files.createDirectories(root);
            // The stored name is random: the client-supplied name is never used, so path traversal is impossible.
            String name = UUID.randomUUID() + "." + ext;
            Path target = root.resolve(name).normalize();
            if (!target.startsWith(root)) throw new BadRequestException("Invalid file name.");
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return "/uploads/" + name;
        } catch (IOException e) {
            throw new IllegalStateException("Could not store the uploaded file.", e);
        }
    }

    private static boolean signatureMatches(byte[] h, String ext) {
        switch (ext) {
            case "jpg":  return (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF;
            case "png":  return (h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G';
            case "gif":  return h[0] == 'G' && h[1] == 'I' && h[2] == 'F' && h[3] == '8';
            case "webp": return h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F' && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P';
            default:     return false;
        }
    }
}
