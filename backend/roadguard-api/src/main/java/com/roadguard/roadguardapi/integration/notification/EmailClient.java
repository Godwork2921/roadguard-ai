package com.roadguard.roadguardapi.integration.notification;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class EmailClient {

    private static final Logger log = LoggerFactory.getLogger(EmailClient.class);

    private final JavaMailSender mailSender;

    public EmailClient(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendEmail(String to, String subject, String body) {
        log.debug("Sending email to: {}, subject: {}", to, subject);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.debug("Email sent successfully to {}", to);
        } catch (MailException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        log.debug("Sending HTML email to: {}, subject: {}", to, subject);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(mimeMessage);
            log.debug("HTML email sent successfully to {}", to);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendEmailWithAttachment(String to, String subject, String body, String attachmentPath) {
        log.debug("Sending email with attachment to: {}, subject: {}, attachment: {}", to, subject, attachmentPath);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);

            File attachment = new File(attachmentPath);
            if (attachment.exists()) {
                helper.addAttachment(attachment.getName(), attachment);
            } else {
                log.warn("Attachment not found: {}", attachmentPath);
            }

            mailSender.send(mimeMessage);
            log.debug("Email with attachment sent successfully to {}", to);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send email with attachment to {}: {}", to, e.getMessage());
        }
    }
}
