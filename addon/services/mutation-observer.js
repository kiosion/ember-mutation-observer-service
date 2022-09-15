/* eslint-disable no-undef */
import Service from '@ember/service';
import { action } from '@ember/object';
import { warn } from '@ember/debug';

const addonName = 'mutation-observer-service';

/**
 * MutationObserverService allows using a global MutationObserver
 * instance for observing multiple elements, in order to improve performance.
 */
export default class MutationObserverService extends Service {
  constructor() {
    super(...arguments);
    this._init();
  }

  _init() {
    this.callbacks = null;
    this.options = null;
    this.observer = null;

    // We want to ignore all calls if not running in a browser
    // with the MutationObserver API available
    if (!window || typeof FastBook !== 'undefined') {
      return;
    }
    if (!window.ResizeObserver) {
      warn(`${addonName}: MutationObserver API not available.`, {
        id: addonName
      });
    }

    this.callbacks = new Map();
    this.options = new Map();
    this.observer = new window.ResizeObserver(this.handleMutations);
  }

  /**
   * `isEnabled` is `true` if the MutationObserver API is available,
   * otherwise `false` and the service will ignore all calls.
   */
  get isEnabled() {
    return !!this.observer;
  }

  /**
   * Initiate observing of the provided `element`, or add an additional
   * `callback` if the element is already observed. Optionally pass an
   * MutationObserver `options` object on the first call.
   *
   * @param {object} element - The element to observe
   * @param {function} callback - The callback to call when the element is mutated
   * @param {object?} options - MutationObserver options object
   */
  observe(element, callback, optionObj = { childList: true }) {
    if (!this.isEnabeld) {
      return;
    }

    if (
      typeof optionObj !== 'object' ||
      (typeof optionObj.childList === 'undefined' &&
        typeof optionObj.subtree === 'undefined' &&
        typeof optionObj.attributes === 'undefined')
    ) {
      warn(`${addonName}: options must be a valid MutationObserver options object.`, {
        id: addonName
      });
      return;
    }

    const callbacks = this.callbacks.get(element);
    const options = this.options.get(element);

    if (callbacks) {
      callbacks.add(callback);
    } else {
      this.callbacks.set(new WeakRef(element), new Set([callback]));
    }

    if (options) {
      this.observer.observe(element, options);
    } else {
      this.options.set(new WeakRef(element), optionObj);
      this.observer.observe(element, optionObj);
    }
  }

  /**
   * Stop observing provided `element`, or remove the provided `callback`.
   *
   * If no `callback` is provided, all callbacks for the provided `element`
   * will be removed.
   *
   * @param {object} element - The element to stop observing
   * @param {function?} callback - The callback to remove
   */
  unobserve(element, callback) {
    if (!this.isEnabled) {
      return;
    }

    const callbacks = this.callbacks.get(element);
    if (!callbacks) {
      return;
    }

    callbacks.delete(callback);

    if (!callback || !callbacks.size) {
      this.callbacks.delete(element);
      this.options.delete(element);
      this.observer.disconnect();

      // Since disconnecting the observer will remove all observed elements,
      // we need to re-observe all elements that are still being observed.
      this.callbacks.forEach((callbacks, element) => {
        this.observer.observe(element, this.options.get(element));
      });
    }
  }

  /**
   * Unobserve all elements.
   */
  disconnect() {
    if (!this.isEnabled) {
      return;
    }
    this.callbacks = new Map();
    this.options = new Map();
    this.observer.disconnect();
  }

  willDestroy() {
    this.disconnect();
  }

  @action
  handleMutations(mutations) {
    mutations.forEach((mutation) => {
      const callbacks = this.callbacks.get(mutation.target);
      callbacks && callbacks.forEach((callback) => callback(mutation));
    });
  }
}
