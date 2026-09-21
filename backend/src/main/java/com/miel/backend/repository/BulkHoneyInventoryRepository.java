package com.miel.backend.repository;

import com.miel.backend.model.BulkHoneyInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BulkHoneyInventoryRepository extends JpaRepository<BulkHoneyInventory, Integer> {
}
