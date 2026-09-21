package com.miel.backend.repository;

import com.miel.backend.model.PresentationStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PresentationStockRepository extends JpaRepository<PresentationStock, Integer> {
}
