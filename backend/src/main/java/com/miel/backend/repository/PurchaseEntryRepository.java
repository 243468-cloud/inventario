package com.miel.backend.repository;

import com.miel.backend.model.PurchaseEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseEntryRepository extends JpaRepository<PurchaseEntry, Integer> {
    List<PurchaseEntry> findByInventoryItemIdOrderByEntryDateDesc(Integer inventoryItemId);
}
