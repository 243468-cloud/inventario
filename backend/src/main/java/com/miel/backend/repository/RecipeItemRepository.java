package com.miel.backend.repository;

import com.miel.backend.model.RecipeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeItemRepository extends JpaRepository<RecipeItem, Integer> {
    List<RecipeItem> findByPresentationId(Integer presentationId);
}
