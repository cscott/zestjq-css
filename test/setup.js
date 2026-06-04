// Provide a DOM environment before zest.js initializes.
// zest reads `document.compareDocumentPosition` at module load time;
// this stub satisfies that check without a full browser environment.
import domino from 'domino';
const window = domino.createWindow('<!DOCTYPE html>');
globalThis.document = window.document;
globalThis.window = window;
