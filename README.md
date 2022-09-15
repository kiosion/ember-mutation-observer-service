# MutationObserverService

`MutationObserverService` enables using a single `MutationObserver` instance to observe multiple elements app-wide. This drastically reduces performance overhead when observing multiple elements or elements with large subtrees.

This service can be used by itself, or in creating tools that benefit from observing specific changes in DOM elements or their children. It's largely based on [ember-resize-kitchen-sink](https://github.com/PrecisionNutrition/ember-resize-kitchen-sink/)'s `ResizeService`.

## Installation

Not yet published, so you'll need to install directly from GitHub, either by cloning and using `yarn/npm link`, or by specifying the repo in your `package.json`:

```json
"ember-mutation-observer-service": "git://github.com/kiosion/ember-mutation-observer-service.git"
```

## Usage

### Service API

#### `isEnabled`
This boolean is `true` if the current environment supports the `ResizeObserver` and `WeakRef` APIs. If either of these are unavailable, the service will not be enabled and won't respond to any calls.

#### `observe(element, callback, options?)`
Starts observing the provided DOM `element` for changes based on optional `options` object. `options` is passed directly to the `MutationObserver` constructor, and must be a valid `MutationObserver` options object - it defaults to `{ childList: true }`. `callback` is the function that will be invoked on each change - If the element is already observed, this callback will be added to the list of callbacks to be invoked.

##### Params
- `element` - The DOM element to observe
- `callback` - The function to invoke on each change
- `options` - Optional `MutationObserver` options object

#### `unobserve(element, callback)`
Stops observing the provided DOM `element` for changes. If `callback` is provided, it will be removed from the list of callbacks to be invoked on changes. If `callback` is not provided, all callbacks for the element will be removed.

##### Params
- `element` - The DOM element to stop observing
- `callback` - Optional callback to remove from the list of callbacks

#### `disconnect()`
Stops observing all elements and clears the `callbacks` and `options` maps.

### Example usage

```js
import Component from '@glimmer/component';
import { service } from '@ember/service';

export default class MyComponent extends Component {
  @service mutationObserver;

  constructor() {
    super(...arguments);

    this.mutationObserver.observe(this.element, this.handleMutation);
  }

  willDestroy() {
    this.mutationObserver.unobserve(this.element);
  }

  handleMutation = () => {
    // Do something in this callback function
  }
}
```
