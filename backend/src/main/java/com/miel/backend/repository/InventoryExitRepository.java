package com.miel.backend.repository;

import com.miel.backend.model.InventoryExit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryExitRepository extends JpaRepository<InventoryExit, Integer> {
    List<InventoryExit> findAllByOrderByExitDateDesc();
}
