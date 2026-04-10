package com.example.backend.controller;

import com.example.backend.service.CaptchaVerificationService;
import com.example.backend.service.SubmissionEmailService;
import jakarta.mail.MessagingException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/submissions")
@CrossOrigin(origins = "http://localhost:5173")
public class SubmissionController {

    private final SubmissionEmailService submissionEmailService;
    private final CaptchaVerificationService captchaVerificationService;

    public SubmissionController(
        SubmissionEmailService submissionEmailService,
        CaptchaVerificationService captchaVerificationService
    ) {
        this.submissionEmailService = submissionEmailService;
        this.captchaVerificationService = captchaVerificationService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> submit(
        @RequestParam("type") String type,
        @RequestParam("captchaToken") String captchaToken,
        @RequestParam(value = "text", required = false) String text,
        @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        try {
            if (!captchaVerificationService.verify(captchaToken)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Captcha verification failed."));
            }

            if ("text".equalsIgnoreCase(type)) {
                if (text == null || text.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Text is required for text submissions."));
                }

                submissionEmailService.sendTextSubmission(text.trim());
                return ResponseEntity.ok(Map.of("message", "Text submission sent for manual review."));
            }

            if ("image".equalsIgnoreCase(type)) {
                if (image == null || image.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Image file is required for image submissions."));
                }

                if (image.getContentType() == null || !image.getContentType().startsWith("image/")) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Only image files are allowed."));
                }

                submissionEmailService.sendImageSubmission(image);
                return ResponseEntity.ok(Map.of("message", "Image submission sent for manual review."));
            }

            return ResponseEntity.badRequest().body(Map.of("message", "Unsupported type. Use text or image."));
        } catch (MessagingException | IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to send submission email."));
        }
    }
}
