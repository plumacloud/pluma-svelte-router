import Home from './components/Home.svelte';
import About from './components/About.svelte';
import Modal from './components/Modal.svelte';
import Error from './components/Error.svelte';
import Nested from './components/Nested.svelte';
import ChildA from './components/ChildA.svelte';
import ChildB from './components/ChildB.svelte';
import GrandchildA from './components/GrandchildA.svelte';

export default {
	notFoundComponent: Error,
	routes: [
		{ path: '/', component: Home },
		{ path: '/about', component: About },
		{ path: '/about/some-modal', components: [About, Modal], blockPageScroll: true },
		{
			path: '/nested',
			component: Nested,
			children: [
				{
					path: 'child-a',
					component: ChildA,
					children: [
						{ path: 'grandchild-a', component: GrandchildA }
					]
				},
				{ path: 'child-b', component: ChildB }
			]
		}
	]
};