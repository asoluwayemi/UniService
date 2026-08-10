package com.uniservice.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePublicationRequest {
    @NotBlank(message = "Publication title is required")
    private String title;

    @NotBlank(message = "Journal or publisher is required")
    private String journalPublisher;

    @NotNull(message = "Year published is required")
    private Integer yearPublished;

    private String doiIsbn;

    @NotBlank(message = "Category is required")
    private String category;

    private BigDecimal impactFactor;

    private String documentUrl;
}
