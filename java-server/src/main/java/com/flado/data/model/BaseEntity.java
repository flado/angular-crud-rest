/*
 * Copyright (c) 2002-2003 Allianz Australia Ltd. (Allianz) All Rights Reserved.
 * This work is a trade secret of Allianz and unauthorized use or copying is prohibited.
 */
package com.flado.data.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.sql.Timestamp;
import java.util.Calendar;

import javax.persistence.Column;
import javax.persistence.MappedSuperclass;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;

/**
 * Base entity.
 * 
 * @author flado
 * 
 */
@MappedSuperclass
public class BaseEntity {  

  @Column(name = "LAST_UPDATE_TS", insertable = false, updatable = true)
  @JsonIgnore
  private Timestamp lastUpdateTimestamp;

  @Column(name = "CREATE_TS", nullable = false, updatable = false, insertable = true)
  @JsonIgnore
  private Timestamp createTimestamp;

  @Column(name = "LAST_UPDATE_BY", columnDefinition = "varchar(40)", insertable = false, updatable = true)
  @JsonIgnore
  private String lastUpdateBy;

  @Column(name = "CREATE_BY", columnDefinition = "varchar(40)", nullable = false, updatable = false, insertable = true)
  @JsonIgnore
  private String createBy;

  public Timestamp getLastUpdateTimestamp() {
    return lastUpdateTimestamp;
  }

  public void setLastUpdateTimestamp(Timestamp lastUpdateTimestamp) {
    this.lastUpdateTimestamp = lastUpdateTimestamp;
  }

  public Timestamp getCreateTimestamp() {
    return createTimestamp;
  }

  public void setCreateTimestamp(Timestamp createTimestamp) {
    this.createTimestamp = createTimestamp;
  }

  public String getLastUpdateBy() {
    return lastUpdateBy;
  }

  public void setLastUpdateBy(String lastUpdateBy) {
    this.lastUpdateBy = lastUpdateBy;
  }

  public String getCreateBy() {
    return createBy;
  }

  public void setCreateBy(String createBy) {
    this.createBy = createBy;
  }

  @PrePersist
  private void onInsert() {
    Calendar calendar = Calendar.getInstance();
    Timestamp timestamp = new java.sql.Timestamp(calendar.getTime().getTime());
    setCreateTimestamp(timestamp);
    setCreateBy("FLADO.create"); 
  }

  @PreUpdate
  private void onUpdate() {
    Calendar calendar = Calendar.getInstance();
    Timestamp timestamp = new java.sql.Timestamp(calendar.getTime().getTime());
    setLastUpdateTimestamp(timestamp);
    setLastUpdateBy("FLADO.update");  
  }
  

}
