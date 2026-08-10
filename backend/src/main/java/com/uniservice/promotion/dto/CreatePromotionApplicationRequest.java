package com.uniservice.promotion.dto;

import jakarta.validation.constraints.Size;

public record CreatePromotionApplicationRequest(@Size(max = 2000) String staffStatement) {}
