import { profile } from "../data/profile";
import { skills } from "../data/skills";
import { projects } from "../data/projects";
import { services } from "../data/services";
import { education } from "../data/education";
import { experience } from "../data/experience";
import { certificates } from "../data/certificates";
import { resume } from "../data/resume";
import { socialLinks } from "../data/socialLinks";
import { tools } from "../data/tools";
import { testimonials } from "../data/testimonials";
import { worldDestinations } from "../data/worldDestinations";

// Components depend on this interface, so a future API can replace local data here.
export const portfolioRepository = {
  getProfile() { return profile; },
  getSkills() { return skills; },
  getProjects() { return projects; },
  getServices() { return services; },
  getEducation() { return education; },
  getExperience() { return experience; },
  getCertificates() { return certificates; },
  getResume() { return resume; },
  getSocialLinks() { return socialLinks; },
  getTools() { return tools; },
  getTestimonials() { return testimonials; },
  getWorldDestinations() { return worldDestinations; },
  getPortfolio() {
    return {
      profile: this.getProfile(),
      skills: this.getSkills(),
      projects: this.getProjects(),
      services: this.getServices(),
      education: this.getEducation(),
      experience: this.getExperience(),
      certificates: this.getCertificates(),
      resume: this.getResume(),
      socialLinks: this.getSocialLinks(),
      tools: this.getTools(),
      testimonials: this.getTestimonials(),
      worldDestinations: this.getWorldDestinations(),
    };
  },
};
