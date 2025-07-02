<script lang="ts">
	import '../app.css';
	import debug from 'debug';
	import { dev } from '$app/environment';

	let { children } = $props();

	if (dev) {
		debug.enable('*');
	}
</script>

{@render children()}
