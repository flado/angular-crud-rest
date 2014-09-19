/*
 * Copyright (c) 2002-2003 Allianz Australia Ltd. (Allianz) All Rights Reserved.
 * This work is a trade secret of Allianz and unauthorized use or copying is prohibited.
 */
package com.flado.data.model;

import com.google.common.base.Objects;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.PostLoad;
import javax.persistence.Table;
import javax.persistence.Transient;

/**
 * TPP Stream ref tables
 *
 * @author flado
 *
 */
@Entity
@Table(name = "STREAM", schema = "REF")
public class StreamEntity extends BaseEntity {

  @SuppressWarnings("unused")
  private static final long serialVersionUID = -5044820453256180051L;

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "STREAM_ID", columnDefinition = "integer")
  private Long id;
  
  @Column(name = "CODE", columnDefinition = "integer", nullable = false, updatable = true, unique = true)
  private Integer code;

  @Column(name = "DSCR", columnDefinition = "varchar(100)", nullable = false, updatable = true)
  private String desc;
  
  @Transient    
  private Long key;
  
  @PostLoad
  private void setupKey() {
    this.key = this.id;
  }
    
  public Long getKey() {
    return key;
  }
  
  public Integer getCode() {
    return code;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public void setCode(Integer code) {
    this.code = code;
  }

  public String getDesc() {
    return desc;
  }

  public void setDesc(String desc) {
    this.desc = desc;
  }

  @Override
  public String toString() {
    return Objects.toStringHelper(this.getClass()).add("code", code).add("desc", desc).toString();
  }
}
