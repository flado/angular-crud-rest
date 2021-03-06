/*
 * Copyright (c) 2002-2003 Allianz Australia Ltd. (Allianz) All Rights Reserved.
 * This work is a trade secret of Allianz and unauthorized use or copying is prohibited.
 */
package com.flado.data.dao;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;

import com.flado.data.model.StreamEntity;

import java.util.List;

/**
 * Stream DAO
 * 
 * @author flado
 */
@Repository("stream")
@RepositoryRestResource(collectionResourceRel = "stream", path = "stream")
public interface StreamDAO extends JpaRepository<StreamEntity, Long> {
  
  /*@Query("SELECT s FROM StreamEntity s ORDER BY s.id")
  List<StreamEntity> getAllRecords();*/
    
  Page<StreamEntity> findByCodeOrDescLike(final @Param("code") Integer code, final @Param("desc") String desc, Pageable page);
  
  Page<StreamEntity> findByCodeAndDescLike(final @Param("code") Integer code, final @Param("desc") String desc, Pageable page);
  
  List<StreamEntity> findByCode(final @Param("code") Integer code);
  
  Page<StreamEntity> findByType(final @Param("type") String type, Pageable page);

/*  @Query("select f from Foo f where f.name like %?1% or f.alias like %?1% or ...")
  public List<Foo> findByAnyColumnContaining(String text, Pageable pageable);*/
  
}
