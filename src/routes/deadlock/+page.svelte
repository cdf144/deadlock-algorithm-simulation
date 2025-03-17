<script lang="ts">
    import Button from '$lib/components/Button.svelte';
    import {
        DeadlockDetection,
        type DeadlockDetectionStep,
    } from '$lib/utils/classes/deadlock-detection.class';
    import { onMount } from 'svelte';

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
    let deadlockSteps = $state<DeadlockDetectionStep[]>([]);
    let deadlockStepIndex = $state(0);
    let showingDeadlockSteps = $state(false);

    onMount(() => {
        available = Array(numResources).fill(0);
        allocation = Array(numProcesses)
            .fill(0)
            .map(() => Array(numResources).fill(0));
        request = Array(numProcesses)
            .fill(0)
            .map(() => Array(numResources).fill(0));
        resourceNames = Array(numResources)
            .fill('')
            .map((_, i) => String.fromCharCode(65 + i));
        processNames = Array(numProcesses)
            .fill('')
            .map((_, i) => `P${i}`);

        // Set up tab functionality
        const allocationTab = document.getElementById('allocation-tab');
        const requestTab = document.getElementById('request-tab');
        const allocationContent = document.getElementById('allocation-content');
        const requestContent = document.getElementById('request-content');

        if (allocationTab && requestTab && allocationContent && requestContent) {
            allocationTab.addEventListener('click', () => {
                allocationTab.classList.add('border-blue-600', 'text-blue-600');
                allocationTab.classList.remove('border-transparent', 'hover:border-gray-300');
                requestTab.classList.remove('border-blue-600', 'text-blue-600');
                requestTab.classList.add('border-transparent', 'hover:border-gray-300');

                allocationContent.classList.remove('hidden');
                requestContent.classList.add('hidden');
            });

            requestTab.addEventListener('click', () => {
                requestTab.classList.add('border-blue-600', 'text-blue-600');
                requestTab.classList.remove('border-transparent', 'hover:border-gray-300');
                allocationTab.classList.remove('border-blue-600', 'text-blue-600');
                allocationTab.classList.add('border-transparent', 'hover:border-gray-300');

                requestContent.classList.remove('hidden');
                allocationContent.classList.add('hidden');
            });
        }
    });

    function addResource() {
        numResources++;
        resourceNames = [...resourceNames, String.fromCharCode(65 + numResources - 1)];
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

    <!-- Input Section -->
    <section class="mb-8 space-y-4">
        <!-- Resources Section -->
        <div class="rounded-lg border border-gray-200 p-4 shadow-sm">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-xl font-bold">Resources</h2>
                <div class="flex space-x-2">
                    <Button
                        color="blue"
                        size="md"
                        onclick={addResource}
                        disabled={numResources >= 10}
                    >
                        +
                    </Button>
                    <Button
                        color="red"
                        size="md"
                        onclick={removeResource}
                        disabled={numResources <= 1}
                    >
                        -
                    </Button>
                </div>
            </div>

            <div class="mb-4">
                <h3 class="mb-2 font-medium">Available</h3>
                <div class="flex flex-wrap items-center">
                    {#each available as value, i}
                        <div class="mr-4 mb-2">
                            <label for="available-{i}" class="mr-1 font-medium">
                                {resourceNames[i]}:
                            </label>
                            <input
                                id="available-{i}"
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
        </div>

        <!-- Processes Section -->
        <div class="rounded-lg border border-gray-200 p-4 shadow-sm">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-xl font-bold">Processes</h2>
                <div class="flex space-x-2">
                    <Button
                        color="blue"
                        size="md"
                        onclick={addProcess}
                        disabled={numProcesses >= 10}
                    >
                        +
                    </Button>
                    <Button
                        color="red"
                        size="md"
                        onclick={removeProcess}
                        disabled={numProcesses <= 1}
                    >
                        -
                    </Button>
                </div>
            </div>

            <!-- Matrix Tabs -->
            <div class="mb-2 border-b">
                <ul class="-mb-px flex flex-wrap text-center text-sm font-medium">
                    <li class="mr-2">
                        <button
                            class="inline-block rounded-t-lg border-b-2 border-blue-600 p-2 text-blue-600"
                            id="allocation-tab"
                        >
                            Allocation
                        </button>
                    </li>
                    <li class="mr-2">
                        <button
                            class="inline-block rounded-t-lg border-b-2 border-transparent p-2 hover:border-gray-300"
                            id="request-tab"
                        >
                            Request
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Matrix Content -->
            <div class="matrix-content space-y-4">
                <!-- Allocation Matrix -->
                <div id="allocation-content" class="mb-0">
                    <h3 class="mb-2 font-medium">Allocation</h3>
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

                <!-- Request Matrix -->
                <div id="request-content" class="hidden">
                    <h3 class="mb-2 font-medium">Request</h3>
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
                                                        request[i][j] = validateNonNegative(
                                                            request[i][j],
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
            </div>
        </div>
    </section>

    <!-- Algorithm Execution Section -->
    <section class="mb-6">
        <div class="rounded-lg border border-gray-200 p-4 shadow-sm">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-medium">Detect Deadlocks</h3>
                <Button
                    color="indigo"
                    size="md"
                    onclick={checkForDeadlocks}
                    disabled={isDeadlocked !== null}
                >
                    Check for Deadlocks
                </Button>
            </div>

            {#if isDeadlocked !== null}
                <!-- Results Panel -->
                <div class="mb-4 rounded-md p-3 {isDeadlocked ? 'bg-red-50' : 'bg-green-50'}">
                    <div class={isDeadlocked ? 'text-red-600' : 'text-green-600'}>
                        <p class="font-semibold">
                            {isDeadlocked ? '⚠️ Deadlock detected!' : '✓ No deadlock detected'}
                        </p>

                        {#if isDeadlocked && deadlockedProcesses.length > 0}
                            <p class="mt-2">
                                <span class="font-medium">Deadlocked processes:</span>
                                {deadlockedProcesses.map((id) => processNames[id]).join(', ')}
                            </p>
                        {/if}
                    </div>
                </div>

                <!-- Step Visualization -->
                {#if showingDeadlockSteps}
                    <div class="mt-4 border-t pt-3">
                        <div class="mb-3 flex items-center justify-between">
                            <h4 class="font-medium">Algorithm Steps</h4>
                            <div class="flex items-center space-x-2">
                                <Button
                                    color="emerald"
                                    size="sm"
                                    onclick={prevDeadlockStep}
                                    disabled={deadlockStepIndex === 0}
                                >
                                    Previous
                                </Button>
                                <span class="flex items-center rounded-md bg-gray-100 px-3 py-1">
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
                            <div class="rounded-md bg-gray-50 p-4 shadow-sm">
                                <p class="mb-3 text-lg font-medium">{step.action}</p>

                                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <!-- Available Resources (Work) -->
                                    <div class="rounded-md bg-white p-3 shadow-sm">
                                        <p class="mb-2 font-medium text-gray-700">
                                            Available (Work):
                                        </p>
                                        <div class="flex flex-wrap items-center">
                                            {#each step.work as amount, i}
                                                <div
                                                    class="mr-2 mb-2 rounded-md bg-blue-100 px-3 py-1 text-blue-800"
                                                >
                                                    {resourceNames[i]}: {amount}
                                                </div>
                                            {/each}
                                        </div>
                                    </div>

                                    <!-- Process Status -->
                                    <div class="rounded-md bg-white p-3 shadow-sm">
                                        <p class="mb-2 font-medium text-gray-700">
                                            Process Status:
                                        </p>
                                        <div class="flex flex-wrap items-center">
                                            {#each step.finish as isFinished, i}
                                                <div
                                                    class="mr-2 mb-2 rounded-md px-3 py-1 {i ===
                                                    step.currentProcess
                                                        ? 'bg-yellow-100 font-bold text-yellow-800'
                                                        : isFinished
                                                          ? 'bg-green-100 text-green-800'
                                                          : 'bg-gray-100 text-gray-800'}"
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
                                    <div class="mt-4 rounded-md bg-white p-3 shadow-sm">
                                        <p class="mb-2 font-medium text-gray-700">
                                            Resources Released:
                                        </p>
                                        <div class="flex flex-wrap items-center">
                                            {#each step.allocated as amount, i}
                                                <div
                                                    class="mr-2 mb-2 rounded-md bg-green-100 px-3 py-1 text-green-800"
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
    </section>

    <!-- Error Messages -->
    {#if errorMessage}
        <div class="mb-4 rounded-md bg-red-100 p-3 text-red-700">
            <p><strong>Error:</strong> {errorMessage}</p>
        </div>
    {/if}
</div>
