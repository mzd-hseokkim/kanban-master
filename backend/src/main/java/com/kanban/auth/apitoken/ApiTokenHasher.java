package com.kanban.auth.apitoken;

import com.kanban.auth.config.ApiTokenProperties;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ApiTokenHasher {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final byte[] secretKey;

    public ApiTokenHasher(ApiTokenProperties properties) {
        if (!StringUtils.hasText(properties.secretKey())) {
            throw new IllegalStateException("API 토큰 해시 시크릿이 설정되지 않았습니다");
        }
        this.secretKey = properties.secretKey().getBytes(StandardCharsets.UTF_8);
    }

    public String hash(String tokenValue) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretKey, HMAC_ALGORITHM));
            byte[] digest = mac.doFinal(tokenValue.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new IllegalStateException("API 토큰 해시 계산에 실패했습니다", ex);
        }
    }
}
