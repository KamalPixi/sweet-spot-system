<?php

namespace App\Console\Commands;

use App\Services\OrderStatusAutomationService;
use Illuminate\Console\Command;

class AutoAdvanceOrderStatusesCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'orders:auto-advance';

    /**
     * The console command description.
     */
    protected $description = 'Automatically advance preparing and ready orders based on store configured time windows';

    /**
     * Execute the console command.
     */
    public function handle(OrderStatusAutomationService $automationService): int
    {
        $result = $automationService->autoAdvanceEligibleOrders();

        $this->info(sprintf(
            'Auto-advance complete: %d orders moved to Ready, %d orders moved to Completed.',
            $result['advanced_to_ready'],
            $result['advanced_to_completed']
        ));

        return Command::SUCCESS;
    }
}
