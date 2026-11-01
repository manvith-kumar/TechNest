package com.technest.controller;

import com.technest.dto.CommonDtos.MessageResponse;
import com.technest.dto.CommonDtos.NewsletterRequest;
import com.technest.service.NewsletterService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/newsletter")
public class NewsletterController {
    private final NewsletterService newsletter;

    public NewsletterController(NewsletterService newsletter) {
        this.newsletter = newsletter;
    }

    @PostMapping
    public MessageResponse subscribe(@Valid @RequestBody NewsletterRequest req) {
        newsletter.subscribe(req.email());
        return new MessageResponse("You're subscribed. Watch your inbox for deals.");
    }
}
