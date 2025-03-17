<script lang="ts">
    import Button from '$lib/components/Button.svelte';
    import { Banker, type BankerStep } from '$lib/utils/classes/banker.class';
    import { onMount } from 'svelte';

    const INITIAL_RESOURCES = 3;
    const INITIAL_PROCESSES = 3;

    let numProcesses = $state(INITIAL_PROCESSES);
    let numResources = $state(INITIAL_RESOURCES);
    let resources = $state<number[]>([]);
    let max = $state<number[][]>([]);
    let allocation = $state<number[][]>([]);
    let resourceNames = $state<string[]>([]);
    let processNames = $state<string[]>([]);
    let requestResult = $state<boolean | null>(null);
    let requestProcessId = $state(0);
    let requestResources = $state<number[]>([]);
    let errorMessage = $state('');

    let isSafe = $state<boolean | null>(null);
    let safeSequence = $state<number[]>([]);
    let bankerSteps = $state<BankerStep[]>([]);
    let bankerStepIndex = $state(0);
    let showingBankerSteps = $state(false);

    onMount(() => {
        resources = Array(numResources).fill(0);
        max = Array(numProcesses)
            .fill(0)
            .map(() => Array(numResources).fill(0));
        allocation = Array(numProcesses)
            .fill(0)
            .map(() => Array(numResources).fill(0));
        resourceNames = Array(numResources)
            .fill(0)
            .map((_, i) => String.fromCharCode(65 + i));
        processNames = Array(numResources)
            .fill(0)
            .map((_, i) => `P${i}`);

        // Set up tab functionality
        const maxTab = document.getElementById('max-tab');
        const allocationTab = document.getElementById('allocation-tab');
        const maxContent = document.getElementById('max-content');
        const allocationContent = document.getElementById('allocation-content');

        if (maxTab && allocationTab && maxContent && allocationContent) {
            maxTab.addEventListener('click', () => {
                maxTab.classList.add('border-blue-600', 'text-blue-600');
                maxTab.classList.remove('border-transparent', 'hover:border-gray-300');
                allocationTab.classList.remove('border-blue-600', 'text-blue-600');
                allocationTab.classList.add('border-transparent', 'hover:border-gray-300');

                maxContent.classList.remove('hidden');
                allocationContent.classList.add('hidden');
            });

            allocationTab.addEventListener('click', () => {
                allocationTab.classList.add('border-blue-600', 'text-blue-600');
                allocationTab.classList.remove('border-transparent', 'hover:border-gray-300');
                maxTab.classList.remove('border-blue-600', 'text-blue-600');
                maxTab.classList.add('border-transparent', 'hover:border-gray-300');

                allocationContent.classList.remove('hidden');
                maxContent.classList.add('hidden');
            });
        }
    });

    function addResource() {
        numResources++;
        resourceNames = [...resourceNames, String.fromCharCode(65 + numResources - 1)];
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

            bankerSteps = banker.getSteps();
            bankerStepIndex = 0;
            showingBankerSteps = bankerSteps.length > 0;
        } catch (error) {
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = 'Unknown error occurred';
            }
            isSafe = null;
            showingBankerSteps = false;
        }
    }

    function makeResourceRequest() {
        try {
            errorMessage = '';
            const banker = new Banker(resources, allocation, max);
            requestResult = banker.requestResources(requestProcessId, requestResources);

            if (requestResult) {
                const state = banker.getState();
                allocation = state.allocation;
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

    function nextBankerStep() {
        if (bankerStepIndex < bankerSteps.length - 1) {
            bankerStepIndex++;
        }
    }

    function prevBankerStep() {
        if (bankerStepIndex > 0) {
            bankerStepIndex--;
        }
    }

    function resetBankerSteps() {
        showingBankerSteps = false;
        bankerSteps = [];
        bankerStepIndex = 0;
    }

    function resetResults() {
        isSafe = null;
        safeSequence = [];
        requestResult = null;
        errorMessage = '';
        resetBankerSteps();
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
    <h1 class="mb-6 text-2xl font-bold">Banker's Algorithm</h1>

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
                <h3 class="mb-2 font-medium">Total</h3>
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
                            id="max-tab"
                        >
                            Max
                        </button>
                    </li>
                    <li class="mr-2">
                        <button
                            class="inline-block rounded-t-lg border-b-2 border-transparent p-2 hover:border-gray-300"
                            id="allocation-tab"
                        >
                            Allocation
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Matrix Content -->
            <div class="matrix-content space-y-4">
                <!-- Max Matrix -->
                <div id="max-content" class="mb-0">
                    <h3 class="mb-2 font-medium">Max</h3>
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

                <!-- Allocation Matrix -->
                <div id="allocation-content" class="hidden">
                    <h3 class="mb-2 font-medium">
                        Allocation <span class="text-sm text-orange-500"
                            >(cannot be greater than Max)</span
                        >
                    </h3>
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
        </div>
    </section>

    <!-- Algorithm Execution Section -->
    <section class="mb-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- Safety Check Section -->
            <div class="rounded-lg border border-gray-200 p-4 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-medium">Check System Safety</h3>
                    <Button
                        color="indigo"
                        size="md"
                        onclick={checkIfSafe}
                        disabled={isSafe !== null}
                    >
                        Check if Safe
                    </Button>
                </div>

                {#if isSafe !== null}
                    <!-- Results Panel -->
                    <div class="mb-4 rounded-md p-3 {isSafe ? 'bg-green-50' : 'bg-red-50'}">
                        <div class={isSafe ? 'text-green-600' : 'text-red-600'}>
                            <p class="font-semibold">
                                {isSafe ? '✓ System is safe' : '⚠️ System is unsafe'}
                            </p>

                            {#if isSafe && safeSequence.length > 0}
                                <p class="mt-2">
                                    <span class="font-medium">Safe Sequence:</span>
                                    {safeSequence.map((id) => processNames[id]).join(' → ')}
                                </p>
                            {/if}
                        </div>
                    </div>

                    <!-- Step Visualization -->
                    {#if showingBankerSteps}
                        <div class="mt-4 border-t pt-3">
                            <div class="mb-3 flex items-center justify-between">
                                <h4 class="font-medium">Algorithm Steps</h4>
                                <div class="flex items-center space-x-2">
                                    <Button
                                        color="emerald"
                                        size="sm"
                                        onclick={prevBankerStep}
                                        disabled={bankerStepIndex === 0}
                                    >
                                        Previous
                                    </Button>
                                    <span
                                        class="flex items-center rounded-md bg-gray-100 px-3 py-1"
                                    >
                                        Step {bankerStepIndex + 1} of {bankerSteps.length}
                                    </span>
                                    <Button
                                        color="emerald"
                                        size="sm"
                                        onclick={nextBankerStep}
                                        disabled={bankerStepIndex === bankerSteps.length - 1}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>

                            {#if bankerSteps[bankerStepIndex]}
                                {@const step = bankerSteps[bankerStepIndex]}
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

            <!-- Resource Request Section -->
            <div class="rounded-lg border border-gray-200 p-4 shadow-sm">
                <h3 class="mb-4 text-lg font-medium">
                    Request Resources
                    <span class="text-sm text-orange-500">(will update Allocation)</span>
                </h3>

                <div class="mb-4">
                    <label for="request-process" class="mb-2 block font-medium"
                        >Select Process:</label
                    >
                    <select
                        id="request-process"
                        bind:value={requestProcessId}
                        class="w-full rounded border border-gray-300 px-3 py-2"
                    >
                        {#each processNames as name, i}
                            <option value={i}>{name}</option>
                        {/each}
                    </select>
                </div>

                <div class="mb-4">
                    <label for="request-resources" class="mb-2 block font-medium">
                        Resource Request:
                    </label>
                    <div class="flex flex-wrap items-center">
                        {#each requestResources as value, i}
                            <div class="mr-4 mb-2">
                                <label for="request-resource-{i}" class="mr-1"
                                    >{resourceNames[i]}:</label
                                >
                                <input
                                    id="request-resource-{i}"
                                    type="number"
                                    bind:value={requestResources[i]}
                                    oninput={() =>
                                        (requestResources[i] = validateNonNegative(
                                            requestResources[i],
                                        ))}
                                    class="w-16 rounded border border-gray-300 px-2 py-1"
                                    min="0"
                                />
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="mb-4">
                    <Button color="purple" size="md" onclick={makeResourceRequest}>
                        Request Resources
                    </Button>
                </div>

                {#if requestResult !== null}
                    <div class="rounded-md p-3 {requestResult ? 'bg-green-50' : 'bg-red-50'}">
                        <p
                            class={requestResult
                                ? 'font-semibold text-green-600'
                                : 'font-semibold text-red-600'}
                        >
                            {requestResult ? '✓ Request granted' : '⚠️ Request denied'}
                        </p>
                        {#if !requestResult}
                            <p class="mt-1 text-red-600">
                                Request would lead to an unsafe state or exceeds available
                                resources.
                            </p>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    </section>

    <!-- Error Messages -->
    {#if errorMessage}
        <div class="mb-4 rounded-md bg-red-100 p-3 text-red-700">
            <p><strong>Error:</strong> {errorMessage}</p>
        </div>
    {/if}
</div>
