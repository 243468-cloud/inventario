package com.miel.backend.repository;

import com.miel.backend.model.RawMaterialCostHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RawMaterialCostHistoryRepository extends JpaRepository<RawMaterialCostHistory, Integer> {
}
