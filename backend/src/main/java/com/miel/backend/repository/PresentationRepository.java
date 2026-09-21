package com.miel.backend.repository;

import com.miel.backend.model.Presentation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PresentationRepository extends JpaRepository<Presentation, Integer> {
    List<Presentation> findByIsActiveTrue();
}
