package com.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Service
public class CaptchaVerificationService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${captcha.enabled:true}")
    private boolean captchaEnabled;

    @Value("${captcha.verify-url}")
    private String verifyUrl;

    @Value("${captcha.secret-key:}")
    private String secretKey;

    public CaptchaVerificationService(ObjectMapper objectMapper) {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = objectMapper;
    }

    public boolean verify(String token) {
        if (!captchaEnabled) {
            return true;
        }

        if (token == null || token.isBlank()) {
            return false;
        }

        if (secretKey == null || secretKey.isBlank() || secretKey.startsWith("replace-with")) {
            return false;
        }

        try {
            String body = "secret=" + URLEncoder.encode(secretKey, StandardCharsets.UTF_8)
                + "&response=" + URLEncoder.encode(token, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(verifyUrl))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return false;
            }

            JsonNode json = objectMapper.readTree(response.body());
            return json.path("success").asBoolean(false);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return false;
        } catch (IOException ex) {
            return false;
        }
    }
}
