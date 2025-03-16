<script lang="ts">
    import Button from '$lib/components/Button.svelte';
    import { Banker } from '$lib/utils/banker.class';

    const INITIAL_RESOURCES = 3;
    const INITIAL_PROCESSES = 3;

    let numProcesses = $state(INITIAL_PROCESSES);
    let numResources = $state(INITIAL_RESOURCES);
    let resources = $state<number[]>([]);
    let max = $state<number[][]>([]);
    let allocation = $state<number[][]>([]);
    let resourceNames = $state<string[]>([]);
    let processNames = $state<string[]>([]);

    let isSafe = $state<boolean | null>(null);
    let safeSequence = $state<number[]>([]);
    let requestResult = $state<boolean | null>(null);
    let requestProcessId = $state(0);
    let requestResources = $state<number[]>([]);
    let errorMessage = $state('');

    let algorithmSteps = $state<any[]>([]);
    let currentStepIndex = $state(0);
    let showingSteps = $state(false);

    // Initialize resources and processes
    resources = Array(INITIAL_RESOURCES).fill(0);
    max = Array(INITIAL_PROCESSES)
        .fill(0)
        .map(() => Array(INITIAL_RESOURCES).fill(0));
    allocation = Array(INITIAL_PROCESSES)
        .fill(0)
        .map(() => Array(INITIAL_RESOURCES).fill(0));
    resourceNames = Array(INITIAL_RESOURCES)
        .fill(0)
        .map((_, i) => `R${i}`);
    processNames = Array(INITIAL_RESOURCES)
        .fill(0)
        .map((_, i) => `P${i}`);

    function addResource() {
        numResources++;
        resourceNames = [...resourceNames, `R${numResources - 1}`];
        resources = [...resources, 0];
        max = max.map((row) => [...row, 0]);
        allocation = allocation.map((row) => [...row, 0]);
        requestResources = [...requestResources, 0];
    }

    function removeResource() {
        if (numResources <= 1) {
            return;
        }
        numResources--;
        resourceNames = resourceNames.slice(0, -1);
        resources = resources.slice(0, -1);
        max = max.map((row) => row.slice(0, -1));
        allocation = allocation.map((row) => row.slice(0, -1));
        requestResources = requestResources.slice(0, -1);
    }

    function addProcess() {
        numProcesses++;
        processNames = [...processNames, `P${numProcesses - 1}`];
        max = [...max, Array(numResources).fill(0)];
        allocation = [...allocation, Array(numResources).fill(0)];
    }

    function removeProcess() {
        if (numProcesses <= 1) {
            return;
        }
        numProcesses--;
        processNames = processNames.slice(0, -1);
        max = max.slice(0, -1);
        allocation = allocation.slice(0, -1);
        if (requestProcessId >= numProcesses) {
            requestProcessId = numProcesses - 1;
        }
    }

    function checkIfSafe() {
        try {
            errorMessage = '';
            const banker = new Banker(resources, allocation, max);
            isSafe = banker.isSafe();
            safeSequence = banker.findSafeSequence();

            // Get steps for visualization
            algorithmSteps = banker.getSteps();
            currentStepIndex = 0;
            showingSteps = algorithmSteps.length > 0;
        } catch (error) {
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = 'Unknown error occurred';
            }
            isSafe = null;
            showingSteps = false;
        }
    }

    function makeRequest() {
        try {
            errorMessage = '';
            const banker = new Banker(resources, allocation, max);
            requestResult = banker.requestResources(requestProcessId, requestResources);

            if (requestResult) {
                const state = banker.getState();
                allocation = state.allocation;
                resources = state.available;
            }
        } catch (error) {
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = 'Unknown error occurred';
            }
            requestResult = null;
        }
    }

    // New functions for step navigation
    function nextStep() {
        if (currentStepIndex < algorithmSteps.length - 1) {
            currentStepIndex++;
        }
    }

    function prevStep() {
        if (currentStepIndex > 0) {
            currentStepIndex--;
        }
    }

    function resetSteps() {
        showingSteps = false;
        algorithmSteps = [];
        currentStepIndex = 0;
    }

    // Update resetResults function
    function resetResults() {
        isSafe = null;
        safeSequence = [];
        requestResult = null;
        errorMessage = '';
        resetSteps();
    }

    function validateNonNegative(value: number): number {
        return value < 0 ? 0 : value;
    }

    $effect(() => {
        requestResources = Array(numResources).fill(0);
        if (requestProcessId >= numProcesses) {
            requestProcessId = numProcesses - 1;
        }
        resetResults();
    });
</script>

<div class="container mx-auto p-4">
    <div class="mb-8">
        <!-- Resources -->
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

            <h3 class="mb-2 text-lg font-medium">Total</h3>

            <div class="flex flex-wrap items-center">
                {#each resources as value, i}
                    <div class="mr-4 mb-2">
                        <label for={`resources-${i}`} class="mr-1 font-medium">
                            {resourceNames[i]}:
                        </label>
                        <input
                            id={`resources-${i}`}
                            type="number"
                            bind:value={resources[i]}
                            oninput={() => {
                                resources[i] = validateNonNegative(resources[i]);
                                resetResults();
                            }}
                            class="w-16 rounded border border-gray-300 px-2 py-1"
                            min="0"
                        />
                    </div>
                {/each}
            </div>
        </div>

        <!-- Processes -->
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

            <h3 class="mb-2 text-lg font-medium">Max</h3>

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
                        {#each max as row, i}
                            <tr>
                                <td class="border border-gray-300 px-4 py-2 font-medium">
                                    {processNames[i]}
                                </td>
                                {#each row as cell, j}
                                    <td class="border border-gray-300 p-1">
                                        <input
                                            type="number"
                                            bind:value={max[i][j]}
                                            oninput={() => {
                                                max[i][j] = validateNonNegative(max[i][j]);
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

        <div class="mb-4">
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
                                                // Ensure allocation <= max
                                                if (allocation[i][j] > max[i][j]) {
                                                    allocation[i][j] = max[i][j];
                                                }
                                                resetResults();
                                            }}
                                            class="w-16 rounded px-2 py-1 text-center"
                                            min="0"
                                            max={max[i][j]}
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

    <!-- Algorithm Operations -->
    <div class="mb-6 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div class="rounded border border-gray-300 p-4">
            <h3 class="m-2 text-lg font-medium">Check System Safety</h3>
            <Button color="purple" size="md" onclick={checkIfSafe} disabled={isSafe !== null}>
                Check if Safe
            </Button>

            {#if isSafe !== null}
                <div class={isSafe ? 'text-green-600' : 'text-red-600'}>
                    <p class="font-semibold">
                        System is {isSafe ? 'safe' : 'unsafe'}
                    </p>

                    {#if isSafe && safeSequence.length > 0}
                        <p class="mt-2">
                            <span class="font-medium">Safe Sequence:</span>
                            {safeSequence.map((id) => processNames[id]).join(' → ')}
                        </p>
                    {/if}
                </div>

                <!-- Step by step -->
                {#if showingSteps}
                    <div class="mt-4 border-t pt-3">
                        <div class="flex items-center justify-between">
                            <h4 class="font-medium">Step by step</h4>
                            <div class="flex space-x-2">
                                <Button
                                    color="emerald"
                                    size="sm"
                                    onclick={prevStep}
                                    disabled={currentStepIndex === 0}
                                >
                                    Previous
                                </Button>
                                <span class="flex items-center px-2">
                                    Step {currentStepIndex + 1} of {algorithmSteps.length}
                                </span>
                                <Button
                                    color="emerald"
                                    size="sm"
                                    onclick={nextStep}
                                    disabled={currentStepIndex === algorithmSteps.length - 1}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>

                        {#if algorithmSteps[currentStepIndex]}
                            {@const step = algorithmSteps[currentStepIndex]}
                            <div class="mt-3 rounded bg-gray-50 p-3">
                                <p class="mb-2 font-medium">{step.action}</p>

                                <div class="grid grid-cols-2 gap-3">
                                    <!-- Available Work -->
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
