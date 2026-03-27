import { Injectable } from "@nestjs/common";

@Injectable()
export class MentionService {
  extractMentions(text: string): string[] {
    if (!text) return [];
    const regex = /@(\w+)/g;
    return [...text.matchAll(regex)].map(m => m[1]);
  }
}
