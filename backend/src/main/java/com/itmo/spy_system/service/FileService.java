package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.File;
import com.itmo.spy_system.repository.FileRepository;
import com.itmo.spy_system.utils.NullAwareBeanUtilsBean;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FileService {
    private final FileRepository repository;

    public List<File> findAll() {
        return repository.findAll();
    }

    public Optional<File> findById(String id) {
        return repository.findById(id);
    }

    public File save(File entity) {
        return repository.save(entity);
    }

    public File patch(File toBePatched) {
        File fromDb = repository.findById(toBePatched.getPath()).get();
        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
        return repository.save(fromDb);
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }
}
