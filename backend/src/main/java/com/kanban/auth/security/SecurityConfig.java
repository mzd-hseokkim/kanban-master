package com.kanban.auth.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.kanban.auth.oauth2.CustomOAuth2UserService;
import com.kanban.auth.oauth2.OAuth2AuthenticationFailureHandler;
import com.kanban.auth.oauth2.OAuth2AuthenticationSuccessHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.Nullable;

/**
 * Spring Security 설정 Spec § 6. 백엔드 규격 - SecurityConfig FR-06a: Google OAuth2 로그인
 */
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final RestAuthenticationEntryPoint authenticationEntryPoint;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http,
                        @Nullable CustomOAuth2UserService customOAuth2UserService,
                        @Nullable OAuth2AuthenticationSuccessHandler successHandler,
                        @Nullable OAuth2AuthenticationFailureHandler failureHandler,
                        @Nullable ClientRegistrationRepository clientRegistrationRepository)
                        throws Exception {
                log.debug("OAuth2 configuration - clients: {}, userService: {}, successHandler: {}, failureHandler: {}",
                                clientRegistrationRepository != null, customOAuth2UserService != null,
                                successHandler != null, failureHandler != null);

                http.csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session.sessionCreationPolicy(
                                                SessionCreationPolicy.STATELESS))
                                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint(authenticationEntryPoint))
                                .authorizeHttpRequests(auth -> auth.requestMatchers(
                                                "/api/v1/auth/**", "/api/v1/health/**",
                                                "/h2-console/**", "/v3/api-docs/**",
                                                "/swagger-ui/**", "/swagger-ui.html", "/uploads/**", // 업로드된
                                                                                                     // 파일(프로필
                                                                                                     // 사진
                                                                                                     // 등)은
                                                                                                     // 인증
                                                                                                     // 없이
                                                                                                     // 접근
                                                                                                     // 가능
                                                "/login/oauth2/**", // OAuth2 로그인 엔드포인트
                                                "/oauth2/**", // OAuth2 콜백 엔드포인트
                                                "/ws/**" // WebSocket 엔드포인트
                                ).permitAll().requestMatchers(HttpMethod.GET, "/actuator/health")
                                                .permitAll().anyRequest().authenticated());

                // OAuth2 설정이 있을 때만 활성화
                if (clientRegistrationRepository != null && customOAuth2UserService != null
                                && successHandler != null && failureHandler != null) {
                        log.info("OAuth2 login enabled");
                        // Spec § 6. 백엔드 규격 - SecurityConfig OAuth2 로그인 활성화
                        http.oauth2Login(oauth2 -> oauth2.userInfoEndpoint(
                                        userInfo -> userInfo.userService(customOAuth2UserService))
                                        .successHandler(successHandler)
                                        .failureHandler(failureHandler));
                } else {
                        log.info("OAuth2 login disabled - missing required beans");
                }

                http.addFilterBefore(jwtAuthenticationFilter,
                                UsernamePasswordAuthenticationFilter.class);
                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}
