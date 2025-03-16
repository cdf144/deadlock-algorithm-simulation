<script lang="ts">
    import Button from '$lib/components/Button.svelte';
    import { DeadlockDetection } from '$lib/utils/deadlock-detection.class';

    const INITIAL_RESOURCES = 3;
    const INITIAL_PROCESSES = 3;

    let numProcesses = $state(INITIAL_PROCESSES);
    let numResources = $state(INITIAL_RESOURCES);
    let available = $state<number[]>([]);
    let allocation = $state<number[][]>([]);
    let request = $state<number[][]>([]);
    let resourceNames = $state<string[]>([]);
    let processNames = $state<string[]>([]);
    let errorMessage = $state('');

    let isDeadlocked = $state<boolean | null>(null);
    let deadlockedProcesses = $state<number[]>([]);
    let deadlockSteps = $state<any[]>([]);
    let deadlockStepIndex = $state(0);
    let showingDeadlockSteps = $state(false);

    available = Array(INITIAL_RESOURCES).fill(0);
    allocation = Array(INITIAL_PROCESSES)
        .fill(0)
        .map(() => Array(INITIAL_RESOURCES).fill(0));
    request = Array(INITIAL_PROCESSES)
        .fill(0)
        .map(() => Array(INITIAL_RESOURCES).fill(0));
    resourceNames = Array(INITIAL_RESOURCES)
        .fill('')
        .map((_, i) => `R${i}`);
    processNames = Array(INITIAL_PROCESSES)
        .fill('')
        .map((_, i) => `P${i}`);

    function addResource() {
        numResources++;
        resourceNames = [...resourceNames, `R${numResources - 1}`];
        available = [...available, 0];
        allocation = allocation.map((row) => [...row, 0]);
        request = request.map((row) => [...row, 0]);
    }

    function removeResource() {
        if (numResources <= 1) {
            return;
        }
        numResources--;
        resourceNames = resourceNames.slice(0, -1);
        available = available.slice(0, -1);
        allocation = allocation.map((row) => row.slice(0, -1));
        request = request.map((row) => row.slice(0, -1));
    }

    function addProcess() {
        numProcesses++;
        processNames = [...processNames, `P${numProcesses - 1}`];
        allocation = [...allocation, Array(numResources).fill(0)];
        request = [...request, Array(numResources).fill(0)];
    }

    function removeProcess() {
        if (numProcesses <= 1) {
            return;
        }
        numProcesses--;
        processNames = processNames.slice(0, -1);
        allocation = allocation.slice(0, -1);
        request = request.slice(0, -1);
    }

    function checkForDeadlocks() {
        try {
            errorMessage = '';
            const detector = new DeadlockDetection(allocation, request, available);
            isDeadlocked = detector.isDeadlocked();
            deadlockedProcesses = detector.getDeadlockedProcesses();

            deadlockSteps = detector.getSteps();
            deadlockStepIndex = 0;
            showingDeadlockSteps = deadlockSteps.length > 0;
        } catch (error) {
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = 'Unknown error occurred';
            }
            isDeadlocked = null;
            showingDeadlockSteps = false;
        }
    }

    function nextDeadlockStep() {
        if (deadlockStepIndex < deadlockSteps.length - 1) {
            deadlockStepIndex++;
        }
    }

    function prevDeadlockStep() {
        if (deadlockStepIndex > 0) {
            deadlockStepIndex--;
        }
    }

    function resetDeadlockSteps() {
        showingDeadlockSteps = false;
        deadlockSteps = [];
        deadlockStepIndex = 0;
    }

    function resetResults() {
        isDeadlocked = null;
        deadlockedProcesses = [];
        errorMessage = '';
        resetDeadlockSteps();
    }

    function validateNonNegative(value: number): number {
        return value < 0 ? 0 : value;
    }

    $effect(() => {
        resetResults();
    });
</script>

<div class="container mx-auto p-4">
    <h1 class="mb-6 text-2xl font-bold">Deadlock Detection Algorithm</h1>

    <div class="mb-8">
        <div class="mb-6">
            <div class="m-2 flex w-1/4 items-center justify-between">
                <h2 class="text-xl font-bold">Resources</h2>
                <div class="flex space-x-2">
                    <Button
                        color="blue"
                        size="lg"
                        onclick={addResource}
                        disabled={numResources >= 10}
                    >
                        +
                    </Button>
                    <Button
                        color="red"
                        size="lg"
                        onclick={removeResource}
                        disabled={numResources <= 1}
                    >
                        -
                    </Button>
                </div>
            </div>

            <h3 class="mb-2 text-lg font-medium">Available</h3>

            <div class="flex flex-wrap items-center">
                {#each available as value, i}
                    <div class="mr-4 mb-2">
                        <label for={`resources-${i}`} class="mr-1 font-medium">
                            {resourceNames[i]}:
                        </label>
                        <input
                            id={`resources-${i}`}
                            type="number"
                            bind:value={available[i]}
                            oninput={() => {
                                available[i] = validateNonNegative(available[i]);
                                resetResults();
                            }}
                            class="w-16 rounded border border-gray-300 px-2 py-1"
                            min="0"
                        />
                    </div>
                {/each}
            </div>
        </div>

        <div class="mb-4">
            <div class="m-2 flex w-1/4 items-center justify-between">
                <h2 class="text-xl font-bold">Processes</h2>
                <div class="flex space-x-2">
                    <Button
                        color="blue"
                        size="lg"
                        onclick={addProcess}
                        disabled={numProcesses >= 10}
                    >
                        +
                    </Button>
                    <Button
                        color="red"
                        size="lg"
                        onclick={removeProcess}
                        disabled={numProcesses <= 1}
                    >
                        -
                    </Button>
                </div>
            </div>

            <h3 class="mb-2 text-lg font-medium">Allocation</h3>

            <div class="overflow-x-auto">
                <table class="w-auto border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border border-gray-300 px-4 py-2">Process</th>
                            {#each resourceNames as name}
                                <th class="border border-gray-300 px-4 py-2">{name}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each allocation as row, i}
                            <tr>
                                <td class="border border-gray-300 px-4 py-2 font-medium">
                                    {processNames[i]}
                                </td>
                                {#each row as cell, j}
                                    <td class="border border-gray-300 p-1">
                                        <input
                                            type="number"
                                            bind:value={allocation[i][j]}
                                            oninput={() => {
                                                allocation[i][j] = validateNonNegative(
                                                    allocation[i][j],
                                                );
                                                resetResults();
                                            }}
                                            class="w-16 rounded px-2 py-1 text-center"
                                            min="0"
                                        />
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="mb-6">
            <h3 class="mb-2 text-lg font-medium">Request</h3>
            <div class="overflow-x-auto">
                <table class="w-auto border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border border-gray-300 px-4 py-2">Process</th>
                            {#each resourceNames as name}
                                <th class="border border-gray-300 px-4 py-2">{name}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each request as row, i}
                            <tr>
                                <td class="border border-gray-300 px-4 py-2 font-medium">
                                    {processNames[i]}
                                </td>
                                {#each row as cell, j}
                                    <td class="border border-gray-300 p-1">
                                        <input
                                            type="number"
                                            bind:value={request[i][j]}
                                            oninput={() => {
                                                request[i][j] = validateNonNegative(request[i][j]);
                                                resetResults();
                                            }}
                                            class="w-16 rounded px-2 py-1 text-center"
                                            min="0"
                                        />
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="mb-6">
        <div class="rounded border border-gray-300 p-4">
            <h3 class="m-2 text-lg font-medium">Detect Deadlocks</h3>
            <Button
                color="indigo"
                size="md"
                onclick={checkForDeadlocks}
                disabled={isDeadlocked !== null}
            >
                Check for Deadlocks
            </Button>

            {#if isDeadlocked !== null}
                <div class={isDeadlocked ? 'text-red-600' : 'text-green-600'}>
                    <p class="mt-4 font-semibold">
                        {isDeadlocked ? 'Deadlock detected!' : 'No deadlock detected'}
                    </p>

                    {#if isDeadlocked && deadlockedProcesses.length > 0}
                        <p class="mt-2">
                            <span class="font-medium">Deadlocked processes:</span>
                            {deadlockedProcesses.map((id) => processNames[id]).join(', ')}
                        </p>
                    {/if}
                </div>

                {#if showingDeadlockSteps}
                    <div class="mt-4 border-t pt-3">
                        <div class="flex items-center justify-between">
                            <h4 class="font-medium">Step by step</h4>
                            <div class="flex space-x-2">
                                <Button
                                    color="emerald"
                                    size="sm"
                                    onclick={prevDeadlockStep}
                                    disabled={deadlockStepIndex === 0}
                                >
                                    Previous
                                </Button>
                                <span class="flex items-center px-2">
                                    Step {deadlockStepIndex + 1} of {deadlockSteps.length}
                                </span>
                                <Button
                                    color="emerald"
                                    size="sm"
                                    onclick={nextDeadlockStep}
                                    disabled={deadlockStepIndex === deadlockSteps.length - 1}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>

                        {#if deadlockSteps[deadlockStepIndex]}
                            {@const step = deadlockSteps[deadlockStepIndex]}
                            <div class="mt-3 rounded bg-gray-50 p-3">
                                <p class="mb-2 font-medium">{step.action}</p>

                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <p class="text-sm font-medium">Available (Work):</p>
                                        <div class="mt-1 flex flex-wrap items-center">
                                            {#each step.work as amount, i}
                                                <div
                                                    class="mr-2 rounded bg-blue-100 px-2 py-1 text-sm"
                                                >
                                                    {resourceNames[i]}: {amount}
                                                </div>
                                            {/each}
                                        </div>
                                    </div>

                                    <div>
                                        <p class="text-sm font-medium">Process Status:</p>
                                        <div class="mt-1 flex flex-wrap items-center">
                                            {#each step.finish as isFinished, i}
                                                <div
                                                    class="mr-2 rounded px-2 py-1 text-sm {i ===
                                                    step.currentProcess
                                                        ? 'bg-yellow-100 font-bold'
                                                        : isFinished
                                                          ? 'bg-green-100'
                                                          : 'bg-gray-100'}"
                                                >
                                                    {processNames[i]}: {isFinished
                                                        ? 'Finished'
                                                        : 'Waiting'}
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                </div>

                                {#if step.allocated}
                                    <div class="mt-3">
                                        <p class="text-sm font-medium">Resources Released:</p>
                                        <div class="mt-1 flex flex-wrap items-center">
                                            {#each step.allocated as amount, i}
                                                <div
                                                    class="mr-2 rounded bg-green-100 px-2 py-1 text-sm"
                                                >
                                                    {resourceNames[i]}: {amount}
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/if}
            {/if}
        </div>
    </div>

    {#if errorMessage}
        <div class="mb-4 rounded bg-red-100 p-3 text-red-700">
            <p><strong>Error:</strong> {errorMessage}</p>
        </div>
    {/if}
</div>
