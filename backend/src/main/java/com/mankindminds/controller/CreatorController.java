package com.mankindminds.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mankindminds.model.Creator;

@RestController
@RequestMapping("/api/creators")
@CrossOrigin(origins = "*")
public class CreatorController {

    private final Map<String, Creator> creatorDatabase = new ConcurrentHashMap<>();

    public CreatorController() {
        seedData();
    }

    @GetMapping
    public List<Creator> getAllCreators() {
        return new ArrayList<>(creatorDatabase.values());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Creator> getCreatorBySlug(@PathVariable String slug) {
        Creator creator = creatorDatabase.get(slug.toLowerCase());
        if (creator == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(creator);
    }

    @PostMapping
    public ResponseEntity<Creator> addCreator(@RequestBody Creator creator) {
        if (creator.getSlug() == null || creator.getSlug().isEmpty()) {
            creator.setSlug(creator.getName().toLowerCase().replace(" ", "-"));
        }
        creatorDatabase.put(creator.getSlug().toLowerCase(), creator);
        return ResponseEntity.ok(creator);
    }

    private void seedData() {
        // 1. Samuel Green
        Creator samuel = new Creator(
            "samuel-green",
            "Samuel Green",
            "Illustrator",
            "Samuel Green creates illustration-led projects across children's books, character design, and visual storytelling.",
            "/assets/samuel-green.jpg",
            "Verified Creator",
            "Samuel Green is a verified illustrator whose creative work has been reviewed by Mankind Minds and confirmed as AI-free.",
            new Creator.AiFreeCard(
                "AI-Free Verification",
                "Samuel’s portfolio demonstrates traditional and self-directed creative practice, including hand-drawn watercolour and coloured pencil illustration, mixed media experimentation, analogue techniques, Risograph printing, branding, children’s books, posters, and physical merchandise.",
                "Proven AI-Free Creator"
            ),
            List.of(
                new Creator.Section(
                    "About Samuel’s Work",
                    "Samuel creates illustration-led projects across children’s books, character design, branding, environmental campaigns, book covers, and visual storytelling. His portfolio includes projects such as A Sleepy Winter, Nature’s Adventurers, Waves of Change, and Family is Forever."
                ),
                new Creator.Section(
                    "Verification Review",
                    "Mankind Minds reviews the materials submitted by each creator to assess whether their creative output is human-made and free from AI generation. For artists, this can include submitted portfolios, sketches, social profiles, project links, and wider creative evidence. Samuel has declared that his submitted creative work was made entirely without the use of AI. Based on the reviewed materials, his creator profile has been approved as AI-free."
                )
            ),
            List.of(
                new Creator.SocialLink("Website", "https://samuelgreenillustration.com/"),
                new Creator.SocialLink("Instagram", "https://instagram.com/samuelgreen_illustration"),
                new Creator.SocialLink("TikTok", "https://www.tiktok.com/@samuelgreen_illustration"),
                new Creator.SocialLink("Linktree", "https://linktr.ee/samuelgreenillustration"),
                new Creator.SocialLink("Email", "mailto:samueljgreen31@gmail.com")
            )
        );

        // 2. Oliver Valentine
        Creator oliver = new Creator(
            "oliver-valentine",
            "Oliver Valentine",
            "Musician",
            "Musician and songwriter in OhValentine, creating noughties-inspired indie rock and performing around Brighton.",
            "/assets/oliver-valentine.jpg",
            "Verified Creator",
            "Oliver Valentine is a verified musician and songwriter whose submitted creative portfolio has been reviewed by Mankind Minds and confirmed as AI-free.",
            new Creator.AiFreeCard(
                "AI-Free Creator Verification",
                "Oliver’s submitted body of work was reviewed as part of the Mankind Minds verification process. His creative practice shows a human-led music process, including songwriting, vocals, production, live instrumentation, and band collaboration with OhValentine.",
                "Proven AI-Free Creator"
            ),
            List.of(
                new Creator.Section(
                    "About Oliver’s Work",
                    "Oliver Valentine is a musician and songwriter in a band called OhValentine. They make noughties-inspired indie rock music and perform around Brighton. His submitted materials reflect a self-directed music process, including writing, vocals, production, live instrumental recording, and band-led performance."
                ),
                new Creator.Section(
                    "Verification Review",
                    "Mankind Minds reviews the materials submitted by each creator to assess whether their creative output is human-made and free from AI generation. For musicians, this can include submitted tracks, recordings, production notes, live performance materials, social profiles, project links, and wider creative evidence. Oliver has declared that his submitted creative work was made entirely without the use of AI. Based on the reviewed materials, his creator profile has been approved as AI-free."
                )
            ),
            List.of(
                new Creator.SocialLink("Instagram - OhValentine", "https://www.instagram.com/ohvalentineband?igsh=cXRzN3V4enFyZmxi&utm_source=qr"),
                new Creator.SocialLink("Instagram - Oliver Valentine Music", "https://www.instagram.com/olivervalentinemusic?igsh=NzQ3bng1ZnFuZTk4&utm_source=qr"),
                new Creator.SocialLink("TikTok", "https://www.tiktok.com/@olivervalentinemusic?_r=1&_t=ZN-96erZFTlLT4"),
                new Creator.SocialLink("SoundCloud", "https://soundcloud.com/oh-valentine-65974085"),
                new Creator.SocialLink("Email", "mailto:olivervalentinemusic@gmail.com")
            )
        );

        // 3. Joseph Melody
        Creator joseph = new Creator(
            "joseph-melody",
            "Joseph Melody",
            "Photographer",
            "Photographer capturing visual stories, captured mainly through the lens of street photography, with a strict commitment to AI-free, authentic imagery.",
            "/assets/joseph-melody.jpg",
            "Verified Creator",
            "Joseph Melody is a verified photographer whose submitted creative portfolio has been reviewed by Mankind Minds and confirmed as AI-free.",
            new Creator.AiFreeCard(
                "AI-Free Verification",
                "Joseph’s submitted body of work was reviewed as part of the Mankind Minds verification process. His creative practice shows a human-led photographic process, including raw image capture, camera operations (both digital and film), and digital post-processing.",
                "Proven AI-Free Creator"
            ),
            List.of(
                new Creator.Section(
                    "About Joseph’s Work",
                    "Joseph Melody is a photographer who creates images for a wide range of purposes, capturing the essence of unique cultures through street photography. His submitted materials reflect a self-directed, intentional photographic process, utilizing physical cameras and traditional editing workflows to capture and share human-led visual stories. He is deeply passionate about the effort that goes into his photography and stands firmly against AI-generated imagery."
                ),
                new Creator.Section(
                    "Verification Review",
                    "Mankind Minds reviews the materials submitted by each creator to assess whether their creative output is human-made and free from AI generation. For photographers, this can include raw images, metadata, camera specifications, editing workflows, portfolio links, and wider creative evidence. Joseph has declared that his submitted creative work was made entirely without the use of AI. Based on the reviewed materials, his creator profile has been approved as AI-free."
                )
            ),
            List.of(
                new Creator.SocialLink("Instagram", "https://instagram.com/joesjpgs"),
                new Creator.SocialLink("Email", "mailto:josephmelody2804@gmail.com")
            )
        );

        creatorDatabase.put(samuel.getSlug(), samuel);
        creatorDatabase.put(oliver.getSlug(), oliver);
        creatorDatabase.put(joseph.getSlug(), joseph);
    }
}