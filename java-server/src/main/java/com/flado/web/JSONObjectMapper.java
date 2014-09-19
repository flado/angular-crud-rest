package com.flado.web;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

/**
 * This class instance must me injected into
 * "org.springframework.http.converter.json.MappingJacksonHttpMessageConverter"
 * when using SpringMVC (Setter method: MappingJacksonHttpMessageConverter.setObjectMapper)
 * 
 * @author flado
 * 
 */
@Component("jsonObjectMapper")
public class JSONObjectMapper extends ObjectMapper {
  
  private static final String DEFAULT_DATE_FORMAT = "dd-MM-yyyy";

  private static final String DEFAULT_DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm'Z'";


  /**
   * Default configuration goes in constructor
   */
  public JSONObjectMapper() {
    setDateFormat(DEFAULT_DATE_FORMAT);
    List<Include> inclusions = new ArrayList<Include>();
    inclusions.add(Include.NON_NULL);
    setSerializationInclusions(inclusions);
  }

  /**
   * Allow to configure the format through spring config XML file
   * 
   * @param format
   */
  public void setDateFormat(String format) {
    setDateFormat(new SimpleDateFormat(format));
  }

  /**
   * Allow to configure the JSON inclusion through spring config XML file
   * 
   * @param inclusions
   */
  public void setSerializationInclusions(List<Include> inclusions) {
    for (Include in : inclusions) {
      setSerializationInclusion(in);
    }
  }

}
