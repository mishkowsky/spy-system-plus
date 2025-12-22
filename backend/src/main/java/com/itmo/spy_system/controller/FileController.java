package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.File;
import com.itmo.spy_system.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import com.itmo.spy_system.entity.Client;
import com.itmo.spy_system.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.nio.file.*;
import java.io.IOException;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {
    @Value("${upload.directory:uploads}")
    private String uploadDirectory;

    private final FileService service;
    private final ClientRepository clientRepository;

    @Secured({"client", "manager", "worker"})
    @GetMapping("/filtered")
    public List<File> getFiltered(@RequestParam(required = false) Long uploaderId) {
        List<File> results = service.findAll();
        if (uploaderId != null) results.removeIf(e -> !e.getUploaderId().equals(uploaderId));
        return results;
    }

    @Secured({"client", "manager", "worker"})
    @GetMapping
    public List<File> getAll() {
        return service.findAll();
    }

    @Secured({"client", "manager", "worker"})
    @GetMapping("/{path}")
    public ResponseEntity<File> getById(@PathVariable String path) {
        return service.findById(path).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @Secured({"client", "manager", "worker"})
    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam String filepath) {
        try {
            Path uploadPath = Paths.get(uploadDirectory);

            Path resolvedPath = uploadPath.resolve(filepath);

            // Prevent directory traversal
//            if (!resolvedPath.startsWith(rootDir)) {
//                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
//            }

            java.io.File file = resolvedPath.toFile();

            if (!file.exists() || !file.isFile()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(file.toURI());
            String contentType = Files.probeContentType(resolvedPath);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filepath + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Secured({"client", "manager", "worker"})
    @PostMapping
    public File create(@RequestBody File entity) {
        return service.save(entity);
    }

    @Secured({"client", "manager", "worker"})
    @PutMapping("/{path}")
    public ResponseEntity<File> update(@PathVariable String path, @RequestBody File entity) {
        if (service.findById(path).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        entity.setPath(path);
        return ResponseEntity.ok(service.save(entity));
    }

    @Secured({"client", "manager", "worker"})
    @DeleteMapping("/{path}")
    public void delete(@PathVariable String path) {
        service.deleteById(path);
    }

    @Autowired
    ObjectMapper objectMapper;

    @Secured({"client", "manager", "worker"})
    @PatchMapping("/{path}")
    public ResponseEntity<File> patch(@PathVariable String path, @RequestBody Map<String, Object> entity) {
        if (service.findById(path).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        File toBePatched = objectMapper.convertValue(entity, File.class);
        toBePatched.setPath(path);
        return ResponseEntity.ok(service.patch(toBePatched));
    }

    @Secured({"client", "manager", "worker"})
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Client uploader = clientRepository.findByEmail(username).orElse(null);
        if (uploader == null) return ResponseEntity.badRequest().body("Invalid uploader");

        try {
            Path uploadPath = Paths.get(uploadDirectory);
            Files.createDirectories(uploadPath);

            String filename = StringUtils.cleanPath(file.getOriginalFilename());
            LocalDateTime now = LocalDateTime.now();
            String isoString = now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            String safeFilename = isoString
                    .replace(":", "-")     // replace colons
                    .replace(".", "_");
            String serverName = safeFilename + "_" + filename;

            Path filePath = uploadPath.resolve(serverName);
            Files.write(filePath, file.getBytes(), StandardOpenOption.CREATE);

            File fileEntity = new File();
            fileEntity.setPath(serverName);
            fileEntity.setName(filename);
            fileEntity.setUploaderId(uploader.getId());
            service.save(fileEntity);

            return ResponseEntity.ok(fileEntity);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error uploading file");
        }
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public String handleIllegalArgumentException(IllegalArgumentException ex) {
        return ex.getMessage();
    }
}
