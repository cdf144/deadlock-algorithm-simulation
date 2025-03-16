<script lang="ts">
    import '../../app.css';
    let { children } = $props();
</script>

<div class="container mx-auto p-4">
    <nav class="mb-8 flex items-center space-x-4 border-b border-gray-200 pb-4">
        <a
            href="/"
            class="text-lg font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800"
        >
            Home
        </a>
        <a
            href="/banker"
            class="text-lg font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800"
        >
            Banker
        </a>

        <a
            href="/deadlock"
            class="text-lg font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800"
        >
            Deadlock Detection
        </a>
    </nav>
</div>

{@render children()}
