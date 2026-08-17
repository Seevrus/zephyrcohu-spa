<?php

namespace Database\Seeders\Concerns;

trait HasWeightedTagPool {
    /**
     * @return array<string, int> tag name => relative weight, heavier tags get picked far more often
     *                            so the resulting tag cloud has a realistic mix of common and rare tags
     */
    private function weightedTagPool(): array {
        return [
            'Billing' => 25,
            'Invoicing' => 22,
            'Getting Started' => 20,
            'Troubleshooting' => 18,
            'Tax Rules' => 16,
            'Reports' => 15,
            'Mobile App' => 14,
            'Security' => 12,
            'Backups' => 12,
            'Integrations' => 11,
            'Updates' => 10,
            'Account Settings' => 9,
            'Permissions' => 8,
            'Notifications' => 8,
            'API' => 7,
            'Export' => 7,
            'Import' => 6,
            'Multi-currency' => 6,
            'Templates' => 5,
            'FAQ' => 5,
            'Onboarding' => 5,
            'Performance' => 4,
            'Data Migration' => 4,
            'Localization' => 3,
            'Beta Features' => 3,
        ];
    }

    /**
     * @return array<int, string> tag names, each repeated according to its weight
     */
    private function weightedTagNamePool(): array {
        $pool = [];

        foreach ($this->weightedTagPool() as $tagName => $weight) {
            $pool = array_merge($pool, array_fill(0, $weight, $tagName));
        }

        return $pool;
    }

    /**
     * @param  array<int, string>  $weightedNames
     * @return array<int, string> unique tag names, more likely to include heavily weighted tags
     */
    private function pickWeightedTags(array $weightedNames, int $count): array {
        shuffle($weightedNames);

        $picked = [];

        foreach ($weightedNames as $name) {
            if (count($picked) === $count) {
                break;
            }

            if (! in_array($name, $picked, true)) {
                $picked[] = $name;
            }
        }

        return $picked;
    }
}
