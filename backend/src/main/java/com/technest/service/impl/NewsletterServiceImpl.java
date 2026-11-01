package com.technest.service.impl;

import com.technest.entity.NewsletterSubscriber;
import com.technest.repository.NewsletterSubscriberRepository;
import com.technest.service.NewsletterService;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NewsletterServiceImpl implements NewsletterService {
    private final NewsletterSubscriberRepository repo;

    public NewsletterServiceImpl(NewsletterSubscriberRepository repo) {
        this.repo = repo;
    }

    @Override
    @Transactional
    public void subscribe(String email) {
        String e = email.trim().toLowerCase(Locale.ROOT);
        if (repo.existsByEmailIgnoreCase(e)) return;   // idempotent; does not reveal who is subscribed
        NewsletterSubscriber s = new NewsletterSubscriber();
        s.setEmail(e);
        repo.save(s);
    }
}
