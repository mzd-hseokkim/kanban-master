package com.kanban.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 인증 메일 재발송 요청 DTO
 *
 * @param email 사용자 이메일 주소
 */
public record ResendVerificationRequest(
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "유효한 이메일 주소를 입력해주세요.")
    String email
) {}
