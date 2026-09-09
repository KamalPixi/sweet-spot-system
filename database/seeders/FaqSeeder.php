<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faqs = [
            [
                'question' => 'What makes your cream cakes special?',
                'answer' => 'Our cream cakes are handcrafted daily using premium organic dairy and double-creamed layers, subtly sweetened and infused with signature flavors like cardamom, saffron, and fresh vanilla pods.',
                'sort_order' => 1,
            ],
            [
                'question' => 'Are your desserts suitable for vegetarians?',
                'answer' => 'Yes! All of our signature desserts, pastries, and cakes are 100% vegetarian-friendly. We do not use animal-derived gelatin in any of our batches.',
                'sort_order' => 2,
            ],
            [
                'question' => 'Do you offer gluten-free or vegan options?',
                'answer' => "We offer several gluten-free alternatives and select vegan pastries weekly. Please check the tags on our product details pages or ask our store staff for today's fresh batch list.",
                'sort_order' => 3,
            ],
            [
                'question' => 'How long do the desserts stay fresh?',
                'answer' => 'Since we do not use artificial preservatives, we recommend consuming our puddings and pastries within 24-48 hours. Keep cream-based cakes refrigerated.',
                'sort_order' => 4,
            ],
            [
                'question' => 'Can I visit your physical store?',
                'answer' => 'Absolutely! Visit us in the heart of London at 10 Soho Street. You can pick up your online collection order straight from the oven.',
                'sort_order' => 5,
            ],
            [
                'question' => 'Can I place a large order for events or parties?',
                'answer' => 'Yes, we cater for events, corporate functions, and private parties. Please contact us at least 48 hours in advance via info@puddinglondon.com.',
                'sort_order' => 6,
            ],
            [
                'question' => 'Do you take custom orders or special requests?',
                'answer' => 'We take custom cake orders and special dietary requests. You can email us or visit our Soho store to align with our master bakers.',
                'sort_order' => 7,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(
                ['question' => $faq['question']],
                [
                    'answer' => $faq['answer'],
                    'sort_order' => $faq['sort_order'],
                    'is_active' => true,
                ]
            );
        }
    }
}
