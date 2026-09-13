<?php

namespace Database\Seeders;

use App\Models\Newsletter;
use App\Models\User;
use Database\Seeders\Concerns\GeneratesArticleContent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NewsletterSeeder extends Seeder {
    use GeneratesArticleContent;

    private const int FULLY_SENT_COUNT = 5;

    private const int PARTIALLY_SENT_COUNT = 4;

    private const int UNSENT_COUNT = 3;

    /**
     * Seed newsletters in every delivery state - fully sent, partially sent and
     * unsent - against the users currently eligible to receive them.
     */
    public function run(): void {
        /** @var array<int, int> $eligibleUserIds */
        $eligibleUserIds = User::where('newsletter', true)->where('confirmed', true)->pluck('id')->all();
        $eligibleCount = count($eligibleUserIds);

        $sentCounts = [
            ...array_fill(0, self::FULLY_SENT_COUNT, $eligibleCount),
            ...array_map(
                static fn () => $eligibleCount > 1 ? random_int(1, $eligibleCount - 1) : 0,
                range(1, self::PARTIALLY_SENT_COUNT),
            ),
            ...array_fill(0, self::UNSENT_COUNT, 0),
        ];

        // Oldest first, so older newsletters are the fully sent ones.
        $daysAgo = count($sentCounts) * 14;

        foreach ($sentCounts as $index => $sentCount) {
            $createdAt = now()->subDays($daysAgo)->subMinutes(random_int(0, 1440));
            $daysAgo -= 14;

            $isOffer = $index % 2 === 1;

            // forceCreate: timestamps are backdated so the list has a realistic history.
            $newsletter = Newsletter::forceCreate([
                'subject' => $isOffer ? $this->offerSubject() : $this->newsSubject(),
                'content' => $isOffer ? $this->offerContent() : $this->newsContent(),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            $recipientIds = $sentCount > 0 ? (array) array_rand(array_flip($eligibleUserIds), $sentCount) : [];

            DB::table('users_newsletters')->insert(array_map(
                static fn (int $userId) => ['user_id' => $userId, 'newsletter_id' => $newsletter->id],
                $recipientIds,
            ));
        }
    }

    private function newsSubject(): string {
        $topics = [
            'Monthly Product Digest', 'System Maintenance Notice', 'New Feature Release', 'Tax Rule Update',
            'Security Advisory', 'Holiday Support Schedule', 'Mobile App Update',
        ];

        return sprintf('%s - %s', $topics[array_rand($topics)], now()->subDays(random_int(0, 365))->format('F Y'));
    }

    private function offerSubject(): string {
        $offers = [
            'Annual Subscription: 20% Off', 'Black Friday Deal Inside', 'Early Renewal Bonus Credits',
            'Upgrade Today and Save 15%', 'Refer a Friend, Get a Month Free', 'Year-End Bundle Package',
        ];

        return $offers[array_rand($offers)];
    }

    private function newsContent(): string {
        $highlights = implode('', array_map(
            fn () => sprintf('<li>%s</li>', $this->sentence()),
            range(1, random_int(3, 5)),
        ));

        return <<<HTML
            <h2>What's new this month</h2>
            <p>Dear Customer,</p>
            <p>{$this->paragraph(2, 3)}</p>
            <h3>Highlights</h3>
            <ul>{$highlights}</ul>
            <hr>
            <p><strong>Good to know:</strong> <em>{$this->paragraph(1, 2)}</em></p>
            <p>Read the full details on our <a href="https://zephyr.co.hu/hirek">news page</a>.</p>
            <p>Best regards,<br>The Zephyr Team</p>
            HTML;
    }

    private function offerContent(): string {
        $discount = random_int(2, 5) * 5;
        $validUntil = now()->addDays(random_int(7, 45))->format('Y-m-d');
        $couponCode = strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 8));

        return <<<HTML
            <h2 style="text-align: center;">Exclusive offer for our subscribers</h2>
            <p style="text-align: center;"><span style="font-size: 18pt; color: #c0392b;"><strong>{$discount}% off</strong></span> your next subscription period</p>
            <p>{$this->paragraph(2, 3)}</p>
            <table style="border-collapse: collapse; width: 100%;" border="1">
                <tbody>
                    <tr><td><strong>Discount</strong></td><td>{$discount}%</td></tr>
                    <tr><td><strong>Coupon code</strong></td><td><span style="background-color: #fbeeb8;">{$couponCode}</span></td></tr>
                    <tr><td><strong>Valid until</strong></td><td>{$validUntil}</td></tr>
                </tbody>
            </table>
            <ol>
                <li>Log in to your account.</li>
                <li>Open the <u>Subscriptions</u> page.</li>
                <li>Enter the coupon code at checkout.</li>
            </ol>
            <p><s>Regular price</s> - <strong>limited time only!</strong> See all current deals on our <a href="https://zephyr.co.hu/akciok">offers page</a>.</p>
            HTML;
    }
}
