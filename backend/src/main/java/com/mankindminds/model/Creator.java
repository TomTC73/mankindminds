package com.mankindminds.model;

import java.util.List;

public class Creator {
    private String slug;
    private String name;
    private String category;
    private String description;
    private String imageUrl;
    private String badgeText;
    private String bio;
    private AiFreeCard aiFreeCard;
    private List<Section> sections;
    private List<SocialLink> socialLinks;

    public Creator() {}

    public Creator(String slug, String name, String category, String description, String imageUrl, 
                   String badgeText, String bio, AiFreeCard aiFreeCard, 
                   List<Section> sections, List<SocialLink> socialLinks) {
        this.slug = slug;
        this.name = name;
        this.category = category;
        this.description = description;
        this.imageUrl = imageUrl;
        this.badgeText = badgeText;
        this.bio = bio;
        this.aiFreeCard = aiFreeCard;
        this.sections = sections;
        this.socialLinks = socialLinks;
    }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getBadgeText() { return badgeText; }
    public void setBadgeText(String badgeText) { this.badgeText = badgeText; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public AiFreeCard getAiFreeCard() { return aiFreeCard; }
    public void setAiFreeCard(AiFreeCard aiFreeCard) { this.aiFreeCard = aiFreeCard; }

    public List<Section> getSections() { return sections; }
    public void setSections(List<Section> sections) { this.sections = sections; }

    public List<SocialLink> getSocialLinks() { return socialLinks; }
    public void setSocialLinks(List<SocialLink> socialLinks) { this.socialLinks = socialLinks; }

    public static class AiFreeCard {
        private String title;
        private String description;
        private String status;

        public AiFreeCard() {}
        public AiFreeCard(String title, String description, String status) {
            this.title = title;
            this.description = description;
            this.status = status;
        }

        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public String getStatus() { return status; }
    }

    public static class Section {
        private String title;
        private String content;

        public Section() {}
        public Section(String title, String content) {
            this.title = title;
            this.content = content;
        }

        public String getTitle() { return title; }
        public String getContent() { return content; }
    }

    public static class SocialLink {
        private String name;
        private String url;

        public SocialLink() {}
        public SocialLink(String name, String url) {
            this.name = name;
            this.url = url;
        }

        public String getName() { return name; }
        public String getUrl() { return url; }
    }
}