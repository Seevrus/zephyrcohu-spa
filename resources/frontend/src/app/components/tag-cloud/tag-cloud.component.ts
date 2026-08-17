import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";

import { type Tag } from "../../../types/knowledgebase";

const TAG_CLOUD_TIER_COUNT = 5;

@Component({
  selector: "app-tag-cloud",
  host: {
    class: "app-tag-cloud",
  },
  imports: [RouterLink],
  templateUrl: "./tag-cloud.component.html",
  styleUrl: "./tag-cloud.component.scss",
})
export class TagCloudComponent {
  tags = input.required<Tag[]>();

  private readonly countRange = computed(() => {
    const counts = this.tags().map((tag) => tag.count);
    return {
      min: Math.min(...counts),
      max: Math.max(...counts),
    };
  });

  protected readonly sizedTags = computed(() => {
    const { min, max } = this.countRange();
    const span = max - min;

    return this.tags().map((tag) => ({
      ...tag,
      sizeTier:
        span === 0
          ? TAG_CLOUD_TIER_COUNT - 1
          : Math.min(
              TAG_CLOUD_TIER_COUNT - 1,
              Math.floor(
                ((tag.count - min) / span) * TAG_CLOUD_TIER_COUNT,
              ),
            ),
    }));
  });
}
