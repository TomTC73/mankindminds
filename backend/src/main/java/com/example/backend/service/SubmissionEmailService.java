package com.example.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class SubmissionEmailService {

    private final JavaMailSender mailSender;

    @Value("${review.email.to}")
    private String reviewEmail;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public SubmissionEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendTextSubmission(String text) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false);

        helper.setFrom(fromEmail);
        helper.setTo(reviewEmail);
        helper.setSubject("New media submission (text)");
        helper.setText("A new text submission was received:\n\n" + text, false);

        mailSender.send(message);
    }

    public void sendImageSubmission(MultipartFile image) throws MessagingException, IOException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(fromEmail);
        helper.setTo(reviewEmail);
        helper.setSubject("New media submission (image)");
        helper.setText("A new image submission was received. See attached file.", false);
        helper.addAttachment(image.getOriginalFilename() != null ? image.getOriginalFilename() : "submission-image", image);

        mailSender.send(message);
    }
}
