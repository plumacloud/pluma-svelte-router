import App from './components/App.svelte';

const app = new App({
	target: document.getElementById('app')
});

export default app;

// export {currentRoute, currentPath, navigate, addQueryParamsToUrl, Router, Route, link, active} from 'pluma-svelte-router';