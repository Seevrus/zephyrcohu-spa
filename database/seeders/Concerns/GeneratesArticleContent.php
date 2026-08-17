<?php

namespace Database\Seeders\Concerns;

trait GeneratesArticleContent {
    /** @var array<int, string> */
    private array $contentSubjects = [
        'The invoicing module', 'Our support team', 'The mobile app', 'The reporting dashboard',
        'The customer portal', 'The billing engine', 'The tax calculation engine', 'The backup service',
        'The API integration', 'The user interface', 'The notification system', 'The export tool',
        'The permission manager', 'The onboarding wizard', 'The subscription manager',
    ];

    /** @var array<int, string> */
    private array $contentVerbs = [
        'has been improved to offer', 'now supports', 'was updated to include', 'received a fix for',
        'is now compatible with', 'has been optimized for', 'now includes', 'was enhanced with',
        'was redesigned to provide', 'now offers',
    ];

    /** @var array<int, string> */
    private array $contentObjects = [
        'faster processing times', 'new export formats', 'improved error handling', 'a redesigned layout',
        'better performance on large datasets', 'additional security checks', 'multi-currency support',
        'automated backups', 'real-time notifications', 'a streamlined checkout flow', 'clearer error messages',
        'more detailed audit logs', 'simplified navigation', 'faster search results', 'improved accessibility',
    ];

    private function paragraph(int $minSentences, int $maxSentences): string {
        $sentenceCount = random_int($minSentences, $maxSentences);

        return implode(' ', array_map(fn () => $this->sentence(), range(1, $sentenceCount)));
    }

    private function sentence(): string {
        return sprintf(
            '%s %s %s.',
            $this->contentSubjects[array_rand($this->contentSubjects)],
            $this->contentVerbs[array_rand($this->contentVerbs)],
            $this->contentObjects[array_rand($this->contentObjects)],
        );
    }
}
