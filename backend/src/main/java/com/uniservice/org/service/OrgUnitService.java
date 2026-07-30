package com.uniservice.org.service;

import com.uniservice.org.entity.OrgUnit;
import com.uniservice.org.repository.OrgUnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrgUnitService {

    private final OrgUnitRepository repository;

    public List<OrgUnit> listAll() {
        return repository.findAll();
    }

    public OrgUnit getById(Long id) {
        return repository.findById(id).orElseThrow();
    }
}
