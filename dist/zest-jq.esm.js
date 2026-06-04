var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var zest$1 = {exports: {}};

/**
 * Zest (https://github.com/chjj/zest)
 * A css selector engine.
 * Copyright (c) 2011-2012, Christopher Jeffrey. (MIT Licensed)
 */

var hasRequiredZest;

function requireZest () {
	if (hasRequiredZest) return zest$1.exports;
	hasRequiredZest = 1;
	(function (module) {
(function() {

		/**
		 * Shared
		 */

		var window = this
		  , document = this.document
		  , old = this.zest;

		/**
		 * Helpers
		 */

		var compareDocumentPosition = (function() {
		  if (document.compareDocumentPosition) {
		    return function(a, b) {
		      return a.compareDocumentPosition(b);
		    };
		  }
		  return function(a, b) {
		    var el = a.ownerDocument.getElementsByTagName('*')
		      , i = el.length;

		    while (i--) {
		      if (el[i] === a) return 2;
		      if (el[i] === b) return 4;
		    }

		    return 1;
		  };
		})();

		var order = function(a, b) {
		  return compareDocumentPosition(a, b) & 2 ? 1 : -1;
		};

		var next = function(el) {
		  while ((el = el.nextSibling)
		         && el.nodeType !== 1);
		  return el;
		};

		var prev = function(el) {
		  while ((el = el.previousSibling)
		         && el.nodeType !== 1);
		  return el;
		};

		var child = function(el) {
		  if (el = el.firstChild) {
		    while (el.nodeType !== 1
		           && (el = el.nextSibling));
		  }
		  return el;
		};

		var lastChild = function(el) {
		  if (el = el.lastChild) {
		    while (el.nodeType !== 1
		           && (el = el.previousSibling));
		  }
		  return el;
		};

		var unquote = function(str) {
		  if (!str) return str;
		  var ch = str[0];
		  return ch === '"' || ch === '\''
		    ? str.slice(1, -1)
		    : str;
		};

		var indexOf = (function() {
		  if (Array.prototype.indexOf) {
		    return Array.prototype.indexOf;
		  }
		  return function(obj, item) {
		    var i = this.length;
		    while (i--) {
		      if (this[i] === item) return i;
		    }
		    return -1;
		  };
		})();

		var makeInside = function(start, end) {
		  var regex = rules.inside.source
		    .replace(/</g, start)
		    .replace(/>/g, end);

		  return new RegExp(regex);
		};

		var replace = function(regex, name, val) {
		  regex = regex.source;
		  regex = regex.replace(name, val.source || val);
		  return new RegExp(regex);
		};

		var truncateUrl = function(url, num) {
		  return url
		    .replace(/^(?:\w+:\/\/|\/+)/, '')
		    .replace(/(?:\/+|\/*#.*?)$/, '')
		    .split('/', num)
		    .join('/');
		};

		/**
		 * Handle `nth` Selectors
		 */

		var parseNth = function(param, test) {
		  var param = param.replace(/\s+/g, '')
		    , cap;

		  if (param === 'even') {
		    param = '2n+0';
		  } else if (param === 'odd') {
		    param = '2n+1';
		  } else if (!~param.indexOf('n')) {
		    param = '0n' + param;
		  }

		  cap = /^([+-])?(\d+)?n([+-])?(\d+)?$/.exec(param);

		  return {
		    group: cap[1] === '-'
		      ? -(cap[2] || 1)
		      : +(cap[2] || 1),
		    offset: cap[4]
		      ? (cap[3] === '-' ? -cap[4] : +cap[4])
		      : 0
		  };
		};

		var nth = function(param, test, last) {
		  var param = parseNth(param)
		    , group = param.group
		    , offset = param.offset
		    , find = !last ? child : lastChild
		    , advance = !last ? next : prev;

		  return function(el) {
		    if (el.parentNode.nodeType !== 1) return;

		    var rel = find(el.parentNode)
		      , pos = 0;

		    while (rel) {
		      if (test(rel, el)) pos++;
		      if (rel === el) {
		        pos -= offset;
		        return group && pos
		          ? !(pos % group) && (pos < 0 === group < 0)
		          : !pos;
		      }
		      rel = advance(rel);
		    }
		  };
		};

		/**
		 * Simple Selectors
		 */

		var selectors = {
		  '*': (function() {
		    if (function() {
		      var el = document.createElement('div');
		      el.appendChild(document.createComment(''));
		      return !!el.getElementsByTagName('*')[0];
		    }()) {
		      return function(el) {
		        if (el.nodeType === 1) return true;
		      };
		    }
		    return function() {
		      return true;
		    };
		  })(),
		  'type': function(type) {
		    type = type.toLowerCase();
		    return function(el) {
		      return el.nodeName.toLowerCase() === type;
		    };
		  },
		  'attr': function(key, op, val, i) {
		    op = operators[op];
		    return function(el) {
		      var attr;
		      switch (key) {
		        case 'for':
		          attr = el.htmlFor;
		          break;
		        case 'class':
		          // className is '' when non-existent
		          // getAttribute('class') is null
		          attr = el.className;
		          if (attr === '' && el.getAttribute('class') == null) {
		            attr = null;
		          }
		          break;
		        case 'href':
		          attr = el.getAttribute('href', 2);
		          break;
		        case 'title':
		          // getAttribute('title') can be '' when non-existent sometimes?
		          attr = el.getAttribute('title') || null;
		          break;
		        case 'id':
		          if (el.getAttribute) {
		            attr = el.getAttribute('id');
		            break;
		          }
		        default:
		          attr = el[key] != null
		            ? el[key]
		            : el.getAttribute && el.getAttribute(key);
		          break;
		      }
		      if (attr == null) return;
		      attr = attr + '';
		      if (i) {
		        attr = attr.toLowerCase();
		        val = val.toLowerCase();
		      }
		      return op(attr, val);
		    };
		  },
		  ':first-child': function(el) {
		    return !prev(el) && el.parentNode.nodeType === 1;
		  },
		  ':last-child': function(el) {
		    return !next(el) && el.parentNode.nodeType === 1;
		  },
		  ':only-child': function(el) {
		    return !prev(el) && !next(el)
		      && el.parentNode.nodeType === 1;
		  },
		  ':nth-child': function(param, last) {
		    return nth(param, function() {
		      return true;
		    }, last);
		  },
		  ':nth-last-child': function(param) {
		    return selectors[':nth-child'](param, true);
		  },
		  ':root': function(el) {
		    return el.ownerDocument.documentElement === el;
		  },
		  ':empty': function(el) {
		    return !el.firstChild;
		  },
		  ':not': function(sel) {
		    var test = compileGroup(sel);
		    return function(el) {
		      return !test(el);
		    };
		  },
		  ':first-of-type': function(el) {
		    if (el.parentNode.nodeType !== 1) return;
		    var type = el.nodeName;
		    while (el = prev(el)) {
		      if (el.nodeName === type) return;
		    }
		    return true;
		  },
		  ':last-of-type': function(el) {
		    if (el.parentNode.nodeType !== 1) return;
		    var type = el.nodeName;
		    while (el = next(el)) {
		      if (el.nodeName === type) return;
		    }
		    return true;
		  },
		  ':only-of-type': function(el) {
		    return selectors[':first-of-type'](el)
		        && selectors[':last-of-type'](el);
		  },
		  ':nth-of-type': function(param, last) {
		    return nth(param, function(rel, el) {
		      return rel.nodeName === el.nodeName;
		    }, last);
		  },
		  ':nth-last-of-type': function(param) {
		    return selectors[':nth-of-type'](param, true);
		  },
		  ':checked': function(el) {
		    return !!(el.checked || el.selected);
		  },
		  ':indeterminate': function(el) {
		    return !selectors[':checked'](el);
		  },
		  ':enabled': function(el) {
		    return !el.disabled && el.type !== 'hidden';
		  },
		  ':disabled': function(el) {
		    return !!el.disabled;
		  },
		  ':target': function(el) {
		    return el.id === window.location.hash.substring(1);
		  },
		  ':focus': function(el) {
		    return el === el.ownerDocument.activeElement;
		  },
		  ':matches': function(sel) {
		    return compileGroup(sel);
		  },
		  ':nth-match': function(param, last) {
		    var args = param.split(/\s*,\s*/)
		      , arg = args.shift()
		      , test = compileGroup(args.join(','));

		    return nth(arg, test, last);
		  },
		  ':nth-last-match': function(param) {
		    return selectors[':nth-match'](param, true);
		  },
		  ':links-here': function(el) {
		    return el + '' === window.location + '';
		  },
		  ':lang': function(param) {
		    return function(el) {
		      while (el) {
		        if (el.lang) return el.lang.indexOf(param) === 0;
		        el = el.parentNode;
		      }
		    };
		  },
		  ':dir': function(param) {
		    return function(el) {
		      while (el) {
		        if (el.dir) return el.dir === param;
		        el = el.parentNode;
		      }
		    };
		  },
		  ':scope': function(el, con) {
		    var context = con || el.ownerDocument;
		    if (context.nodeType === 9) {
		      return el === context.documentElement;
		    }
		    return el === context;
		  },
		  ':any-link': function(el) {
		    return typeof el.href === 'string';
		  },
		  ':local-link': function(el) {
		    if (el.nodeName) {
		      return el.href && el.host === window.location.host;
		    }
		    var param = +el + 1;
		    return function(el) {
		      if (!el.href) return;

		      var url = window.location + ''
		        , href = el + '';

		      return truncateUrl(url, param) === truncateUrl(href, param);
		    };
		  },
		  ':default': function(el) {
		    return !!el.defaultSelected;
		  },
		  ':valid': function(el) {
		    return el.willValidate || (el.validity && el.validity.valid);
		  },
		  ':invalid': function(el) {
		    return !selectors[':valid'](el);
		  },
		  ':in-range': function(el) {
		    return el.value > el.min && el.value <= el.max;
		  },
		  ':out-of-range': function(el) {
		    return !selectors[':in-range'](el);
		  },
		  ':required': function(el) {
		    return !!el.required;
		  },
		  ':optional': function(el) {
		    return !el.required;
		  },
		  ':read-only': function(el) {
		    if (el.readOnly) return true;

		    var attr = el.getAttribute('contenteditable')
		      , prop = el.contentEditable
		      , name = el.nodeName.toLowerCase();

		    name = name !== 'input' && name !== 'textarea';

		    return (name || el.disabled) && attr == null && prop !== 'true';
		  },
		  ':read-write': function(el) {
		    return !selectors[':read-only'](el);
		  },
		  ':hover': function() {
		    throw new Error(':hover is not supported.');
		  },
		  ':active': function() {
		    throw new Error(':active is not supported.');
		  },
		  ':link': function() {
		    throw new Error(':link is not supported.');
		  },
		  ':visited': function() {
		    throw new Error(':visited is not supported.');
		  },
		  ':column': function() {
		    throw new Error(':column is not supported.');
		  },
		  ':nth-column': function() {
		    throw new Error(':nth-column is not supported.');
		  },
		  ':nth-last-column': function() {
		    throw new Error(':nth-last-column is not supported.');
		  },
		  ':current': function() {
		    throw new Error(':current is not supported.');
		  },
		  ':past': function() {
		    throw new Error(':past is not supported.');
		  },
		  ':future': function() {
		    throw new Error(':future is not supported.');
		  },
		  // Non-standard, for compatibility purposes.
		  ':contains': function(param) {
		    return function(el) {
		      var text = el.innerText || el.textContent || el.value || '';
		      return !!~text.indexOf(param);
		    };
		  },
		  ':has': function(param) {
		    return function(el) {
		      return zest(param, el).length > 0;
		    };
		  }
		  // Potentially add more pseudo selectors for
		  // compatibility with sizzle and most other
		  // selector engines (?).
		};

		/**
		 * Attribute Operators
		 */

		var operators = {
		  '-': function() {
		    return true;
		  },
		  '=': function(attr, val) {
		    return attr === val;
		  },
		  '*=': function(attr, val) {
		    return attr.indexOf(val) !== -1;
		  },
		  '~=': function(attr, val) {
		    var i = attr.indexOf(val)
		      , f
		      , l;

		    if (i === -1) return;
		    f = attr[i - 1];
		    l = attr[i + val.length];

		    return (!f || f === ' ') && (!l || l === ' ');
		  },
		  '|=': function(attr, val) {
		    var i = attr.indexOf(val)
		      , l;

		    if (i !== 0) return;
		    l = attr[i + val.length];

		    return l === '-' || !l;
		  },
		  '^=': function(attr, val) {
		    return attr.indexOf(val) === 0;
		  },
		  '$=': function(attr, val) {
		    return attr.indexOf(val) + val.length === attr.length;
		  },
		  // non-standard
		  '!=': function(attr, val) {
		    return attr !== val;
		  }
		};

		/**
		 * Combinator Logic
		 */

		var combinators = {
		  ' ': function(test) {
		    return function(el) {
		      while (el = el.parentNode) {
		        if (test(el)) return el;
		      }
		    };
		  },
		  '>': function(test) {
		    return function(el) {
		      return test(el = el.parentNode) && el;
		    };
		  },
		  '+': function(test) {
		    return function(el) {
		      return test(el = prev(el)) && el;
		    };
		  },
		  '~': function(test) {
		    return function(el) {
		      while (el = prev(el)) {
		        if (test(el)) return el;
		      }
		    };
		  },
		  'noop': function(test) {
		    return function(el) {
		      return test(el) && el;
		    };
		  },
		  'ref': function(test, name) {
		    var node;

		    function ref(el) {
		      var doc = el.ownerDocument
		        , nodes = doc.getElementsByTagName('*')
		        , i = nodes.length;

		      while (i--) {
		        node = nodes[i];
		        if (ref.test(el)) {
		          node = null;
		          return true;
		        }
		      }

		      node = null;
		    }

		    ref.combinator = function(el) {
		      if (!node || !node.getAttribute) return;

		      var attr = node.getAttribute(name) || '';
		      if (attr[0] === '#') attr = attr.substring(1);

		      if (attr === el.id && test(node)) {
		        return node;
		      }
		    };

		    return ref;
		  }
		};

		/**
		 * Grammar
		 */

		var rules = {
		  qname: /^ *([\w\-]+|\*)/,
		  simple: /^(?:([.#][\w\-]+)|pseudo|attr)/,
		  ref: /^ *\/([\w\-]+)\/ */,
		  combinator: /^(?: +([^ \w*]) +|( )+|([^ \w*]))(?! *$)/,
		  attr: /^\[([\w\-]+)(?:([^\w]?=|\/)(inside))?\]/,
		  pseudo: /^(:[\w\-]+)(?:\((inside)\))?/,
		  inside: /(?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|<[^"'>]*>|\\["'>]|[^"'>])*/
		};

		rules.inside = replace(rules.inside, '[^"\'>]*', rules.inside);
		rules.attr = replace(rules.attr, 'inside', makeInside('\\[', '\\]'));
		rules.pseudo = replace(rules.pseudo, 'inside', makeInside('\\(', '\\)'));
		rules.simple = replace(rules.simple, 'pseudo', rules.pseudo);
		rules.simple = replace(rules.simple, 'attr', rules.attr);

		/**
		 * Compiling
		 */

		var compile = function(sel) {
		  var sel = sel.replace(/^\s+|\s+$/g, '')
		    , test
		    , filter = []
		    , buff = []
		    , subject
		    , qname
		    , cap
		    , op
		    , ref;

		  while (sel) {
		    if (cap = rules.qname.exec(sel)) {
		      sel = sel.substring(cap[0].length);
		      qname = cap[1];
		      buff.push(tok(qname, true));
		    } else if (cap = rules.simple.exec(sel)) {
		      sel = sel.substring(cap[0].length);
		      qname = '*';
		      buff.push(tok(qname, true));
		      buff.push(tok(cap));
		    } else {
		      throw new Error('Invalid selector.');
		    }

		    while (cap = rules.simple.exec(sel)) {
		      sel = sel.substring(cap[0].length);
		      buff.push(tok(cap));
		    }

		    if (sel[0] === '!') {
		      sel = sel.substring(1);
		      subject = makeSubject();
		      subject.qname = qname;
		      buff.push(subject.simple);
		    }

		    if (cap = rules.ref.exec(sel)) {
		      sel = sel.substring(cap[0].length);
		      ref = combinators.ref(makeSimple(buff), cap[1]);
		      filter.push(ref.combinator);
		      buff = [];
		      continue;
		    }

		    if (cap = rules.combinator.exec(sel)) {
		      sel = sel.substring(cap[0].length);
		      op = cap[1] || cap[2] || cap[3];
		      if (op === ',') {
		        filter.push(combinators.noop(makeSimple(buff)));
		        break;
		      }
		    } else {
		      op = 'noop';
		    }

		    filter.push(combinators[op](makeSimple(buff)));
		    buff = [];
		  }

		  test = makeTest(filter);
		  test.qname = qname;
		  test.sel = sel;

		  if (subject) {
		    subject.lname = test.qname;

		    subject.test = test;
		    subject.qname = subject.qname;
		    subject.sel = test.sel;
		    test = subject;
		  }

		  if (ref) {
		    ref.test = test;
		    ref.qname = test.qname;
		    ref.sel = test.sel;
		    test = ref;
		  }

		  return test;
		};

		var tok = function(cap, qname) {
		  // qname
		  if (qname) {
		    return cap === '*'
		      ? selectors['*']
		      : selectors.type(cap);
		  }

		  // class/id
		  if (cap[1]) {
		    return cap[1][0] === '.'
		      ? selectors.attr('class', '~=', cap[1].substring(1))
		      : selectors.attr('id', '=', cap[1].substring(1));
		  }

		  // pseudo-name
		  // inside-pseudo
		  if (cap[2]) {
		    return cap[3]
		      ? selectors[cap[2]](unquote(cap[3]))
		      : selectors[cap[2]];
		  }

		  // attr name
		  // attr op
		  // attr value
		  if (cap[4]) {
		    var i;
		    if (cap[6]) {
		      i = cap[6].length;
		      cap[6] = cap[6].replace(/ +i$/, '');
		      i = i > cap[6].length;
		    }
		    return selectors.attr(cap[4], cap[5] || '-', unquote(cap[6]), i);
		  }

		  throw new Error('Unknown Selector.');
		};

		var makeSimple = function(func) {
		  var l = func.length
		    , i;

		  // Potentially make sure
		  // `el` is truthy.
		  if (l < 2) return func[0];

		  return function(el) {
		    if (!el) return;
		    for (i = 0; i < l; i++) {
		      if (!func[i](el)) return;
		    }
		    return true;
		  };
		};

		var makeTest = function(func) {
		  if (func.length < 2) {
		    return function(el) {
		      return !!func[0](el);
		    };
		  }
		  return function(el) {
		    var i = func.length;
		    while (i--) {
		      if (!(el = func[i](el))) return;
		    }
		    return true;
		  };
		};

		var makeSubject = function() {
		  var target;

		  function subject(el) {
		    var node = el.ownerDocument
		      , scope = node.getElementsByTagName(subject.lname)
		      , i = scope.length;

		    while (i--) {
		      if (subject.test(scope[i]) && target === el) {
		        target = null;
		        return true;
		      }
		    }

		    target = null;
		  }

		  subject.simple = function(el) {
		    target = el;
		    return true;
		  };

		  return subject;
		};

		var compileGroup = function(sel) {
		  var test = compile(sel)
		    , tests = [ test ];

		  while (test.sel) {
		    test = compile(test.sel);
		    tests.push(test);
		  }

		  if (tests.length < 2) return test;

		  return function(el) {
		    var l = tests.length
		      , i = 0;

		    for (; i < l; i++) {
		      if (tests[i](el)) return true;
		    }
		  };
		};

		/**
		 * Selection
		 */

		var find = function(sel, node) {
		  var results = []
		    , test = compile(sel)
		    , scope = node.getElementsByTagName(test.qname)
		    , i = 0
		    , el;

		  while (el = scope[i++]) {
		    if (test(el)) results.push(el);
		  }

		  if (test.sel) {
		    while (test.sel) {
		      test = compile(test.sel);
		      scope = node.getElementsByTagName(test.qname);
		      i = 0;
		      while (el = scope[i++]) {
		        if (test(el) && !~indexOf.call(results, el)) {
		          results.push(el);
		        }
		      }
		    }
		    results.sort(order);
		  }

		  return results;
		};

		/**
		 * Native
		 */

		var select = (function() {
		  var slice = (function() {
		    try {
		      Array.prototype.slice.call(document.getElementsByTagName('zest'));
		      return Array.prototype.slice;
		    } catch(e) {
		      e = null;
		      return function() {
		        var a = [], i = 0, l = this.length;
		        for (; i < l; i++) a.push(this[i]);
		        return a;
		      };
		    }
		  })();

		  if (document.querySelectorAll) {
		    return function(sel, node) {
		      try {
		        return slice.call(node.querySelectorAll(sel));
		      } catch(e) {
		        return find(sel, node);
		      }
		    };
		  }

		  return function(sel, node) {
		    try {
		      if (sel[0] === '#' && /^#[\w\-]+$/.test(sel)) {
		        return [node.getElementById(sel.substring(1))];
		      }
		      if (sel[0] === '.' && /^\.[\w\-]+$/.test(sel)) {
		        sel = node.getElementsByClassName(sel.substring(1));
		        return slice.call(sel);
		      }
		      if (/^[\w\-]+$/.test(sel)) {
		        return slice.call(node.getElementsByTagName(sel));
		      }
		    } catch(e) {
		    }
		    return find(sel, node);
		  };
		})();

		/**
		 * Zest
		 */

		var zest = function(sel, node) {
		  try {
		    sel = select(sel, node || document);
		  } catch(e) {
		    if (window.ZEST_DEBUG) {
		      console.log(e.stack || e + '');
		    }
		    sel = [];
		  }
		  return sel;
		};

		/**
		 * Expose
		 */

		zest.selectors = selectors;
		zest.operators = operators;
		zest.combinators = combinators;
		zest.compile = compileGroup;

		zest.matches = function(el, sel) {
		  return !!compileGroup(sel)(el);
		};

		zest.cache = function() {
		  if (compile.raw) return;

		  var raw = compile
		    , cache = {};

		  compile = function(sel) {
		    return cache[sel]
		      || (cache[sel] = raw(sel));
		  };

		  compile.raw = raw;
		  zest._cache = cache;
		};

		zest.noCache = function() {
		  if (!compile.raw) return;
		  compile = compile.raw;
		  delete zest._cache;
		};

		zest.noConflict = function() {
		  window.zest = old;
		  return zest;
		};

		zest.noNative = function() {
		  select = find;
		};

		{
		  module.exports = zest;
		}

		if (window.ZEST_DEBUG) {
		  zest.noNative();
		} else {
		  zest.cache();
		}

		}).call(function() {
		  return this || (typeof window !== 'undefined' ? window : commonjsGlobal);
		}()); 
	} (zest$1));
	return zest$1.exports;
}

var zestExports = requireZest();
var zest = /*@__PURE__*/getDefaultExportFromCjs(zestExports);

class UnreachableError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnreachableError';
    }
}
/**
 * Throw an UnreachableError with an explicit message.
 * Use in place of `throw new JQError(msg)` for code that
 * corresponds to a `LogicException` in the PHP source.
 *
 * @param {string} message
 * @return {never}
 */
function assertNever(message) {
    throw new UnreachableError(message);
}

/**
 * I/O context for JQ evaluation.
 *
 * Holds the input stream and output callbacks (debug, stderr) used by
 * I/O builtins such as input/0, inputs/0, debug/0, and stderr/0.
 *
 * A single instance is currently shared across all JQEnv values derived
 * from a common root; future work will allow built-in definitions to be
 * evaluated with a empty IOContext (since built-ins should not require
 * user interaction during initialization) and then have the user's
 * IOContext replace this empty IOContext during user filter evaluation.
 *
 * TODO: add input stream and debug/stderr callbacks if/when those builtins
 * are ported.
 */
class IOContext {
}

/** Non-local exit thrown by break/$label, caught only by the matching label/$label node. */
class JQBreak extends Error {
    label;
    constructor(label) {
        super(label);
        this.name = new.target.name;
        this.label = label;
    }
}

/**
 * Thrown by halt/0 and halt_error/1 to terminate JQ execution.
 *
 * Intentionally does NOT extend JQError, so it propagates through jq
 * try/catch expressions without being caught by them.
 *
 * exitCode — process exit code (default 0)
 * message  — optional string to write to stderr before exiting;
 *            empty string means no output
 */
class JQHaltException extends Error {
    exitCode;
    constructor(exitCode = 0, message = '') {
        super(message);
        this.exitCode = exitCode;
        this.name = new.target.name;
    }
}

const api = ( function () {
/*
 * Generated by WikiPEG
 */



function peg$subclass(child, parent) {
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function peg$SyntaxError(message, expected, found, location) {
  this.message  = message;
  this.expected = expected;
  this.found    = found;
  this.location = location;

  this.name     = "SyntaxError";
}

peg$subclass(peg$SyntaxError, Error);

function peg$DefaultTracer() {
  this.indentLevel = 0;
}

peg$DefaultTracer.prototype.trace = function(event) {
  var that = this;

  function log(event) {
    function repeat(string, n) {
      var result = "", i;

      for (i = 0; i < n; i++) {
        result += string;
      }

      return result;
    }

    function pad(string, length) {
      return string + repeat(" ", length - string.length);
    }

    function formatArgs(argMap) {
      var argParts = [];
      for (let argName in argMap) {
        if (argName === 'silence') {
          continue;
        }
        if (argName === 'boolParams') {
          argParts.push('0x' + argMap[argName].toString(16));
        } else {
          let displayName = argName.replace(/^param_/, '');
          if (typeof argMap[argName] === 'object' && argMap[argName].value !== undefined) {
            argParts.push(displayName + "=&" + JSON.stringify(argMap[argName].value));
          } else {
            argParts.push(displayName + "=" + argMap[argName]);
          }
        }
      }
      if (argParts.length) {
        return ' <' + argParts.join(', ') + '>';
      } else {
        return '';
      }
    }

    console.log(
      pad(
        event.location.start.line + ":" + event.location.start.column + "-"
        + event.location.end.line + ":" + event.location.end.column + " ",
        20
      )
      + pad(event.type, 10) + " "
      + repeat("  ", that.indentLevel) + event.rule
      + formatArgs(event.args)
    );
  }

  switch (event.type) {
    case "rule.enter":
      log(event);
      this.indentLevel++;
      break;

    case "rule.match":
      this.indentLevel--;
      log(event);
      break;

    case "rule.fail":
      this.indentLevel--;
      log(event);
      break;

    default:
      throw new Error("Invalid event type: " + event.type + ".");
  }
};

function peg$parse(input, options = {}) {
  var peg$currPos = 0,
      peg$savedPos = 0,
      peg$FAILED = {},
      peg$startRule = options.startRule || '(DEFAULT)',
      peg$result;

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  var peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
      peg$maxFailPos       = 0,
      peg$maxFailExpected  = [];

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos],
      p, ch;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line:   details.line,
        column: details.column,
        seenCR: details.seenCR
      };

      while (p < pos) {
        ch = input.charAt(p);
        if (ch === "\n") {
          if (!details.seenCR) { details.line++; }
          details.column = 1;
          details.seenCR = false;
        } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
          details.line++;
          details.column = 1;
          details.seenCR = true;
        } else {
          details.column++;
          details.seenCR = false;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;
      return details;
    }
  }

  function peg$computeLocation(startPos, endPos) {
    if (endPos > input.length) {
      endPos--;
    }
    var startPosDetails = peg$computePosDetails(startPos),
      endPosDetails   = peg$computePosDetails(endPos);

    return {
      start: {
        offset: startPos,
        line:   startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line:   endPosDetails.line,
        column: endPosDetails.column
      }
    };
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) { return; }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildException(message, expected, found, location) {
    function cleanupExpected(expected) {
      var i = 1;

      expected.sort(function(a, b) {
        if (a.type < b.type) {
          return -1;
        } else if (a.type > b.type) {
          return 1;
        } else if (a.value < b.value) {
          return -1;
        } else if (a.value > b.value) {
          return 1;
        } else if (a.description < b.description) {
          return -1;
        } else if (a.description > b.description) {
          return 1;
        } else {
          return 0;
        }
      });

      /*
       * This works because the bytecode generator guarantees that every
       * expectation object exists only once, so it's enough to use |===| instead
       * of deeper structural comparison.
       */
      while (i < expected.length) {
        if (expected[i - 1] === expected[i]) {
          expected.splice(i, 1);
        } else {
          i++;
        }
      }
    }

    function buildMessage(expected, found) {
      function stringEscape(s) {
        function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

        /*
         * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string
         * literal except for the closing quote character, backslash, carriage
         * return, line separator, paragraph separator, and line feed. Any character
         * may appear in the form of an escape sequence.
         *
         * For portability, we also escape all control and non-ASCII characters.
         * Note that "\0" and "\v" escape sequences are not used because JSHint does
         * not like the first and IE the second.
         */
        return s
          .replace(/\\/g,   '\\\\')       // backslash
          .replace(/"/g,    '\\"')        // closing double quote
          .replace(/\x08/g, '\\b')        // backspace
          .replace(/\t/g,   '\\t')        // horizontal tab
          .replace(/\n/g,   '\\n')        // line feed
          .replace(/\f/g,   '\\f')        // form feed
          .replace(/\r/g,   '\\r')        // carriage return
          .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
          .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
          .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
          .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
      }

      var expectedDescs = new Array(expected.length),
        expectedDesc, foundDesc, i;

      for (i = 0; i < expected.length; i++) {
        expectedDescs[i] = expected[i].description;
      }

      expectedDesc = expected.length > 1
        ? expectedDescs.slice(0, -1).join(", ")
        + " or "
        + expectedDescs[expected.length - 1]
        : expectedDescs[0];

      foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

      return "Expected " + expectedDesc + " but " + foundDesc + " found.";
    }

    if (expected !== null) {
      cleanupExpected(expected);
    }

    return new peg$SyntaxError(
      buildMessage(expected, found),
      expected,
      found,
      location
    );
  }

  function peg$buildParseException() {
    return peg$buildException(
      null,
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
    );
  }

  "tracer" in options ? options.tracer : new peg$DefaultTracer();

  

  // expectations
  var peg$c0 = {"type":"end","description":"end of input"};
  var peg$c1 = {"type":"other","description":"Pipe"};
  var peg$c2 = {"type":"literal","value":"import","description":"\"import\""};
  var peg$c3 = {"type":"other","description":"String"};
  var peg$c4 = {"type":"literal","value":"as","description":"\"as\""};
  var peg$c5 = {"type":"other","description":"ImportAlias"};
  var peg$c6 = {"type":"other","description":"ImportMeta"};
  var peg$c7 = {"type":"literal","value":";","description":"\";\""};
  var peg$c8 = {"type":"literal","value":"include","description":"\"include\""};
  var peg$c9 = {"type":"literal","value":"module","description":"\"module\""};
  var peg$c10 = {"type":"literal","value":"def","description":"\"def\""};
  var peg$c11 = {"type":"other","description":"FuncName"};
  var peg$c12 = {"type":"literal","value":":","description":"\":\""};
  var peg$c13 = {"type":"other","description":"Alt"};
  var peg$c14 = {"type":"other","description":"Patterns"};
  var peg$c15 = {"type":"literal","value":"|","description":"\"|\""};
  var peg$c16 = {"type":"literal","value":"label","description":"\"label\""};
  var peg$c17 = {"type":"literal","value":"$","description":"\"$\""};
  var peg$c18 = {"type":"other","description":"Name"};
  var peg$c19 = {"type":"other","description":"Comma"};
  var peg$c20 = {"type":"other","description":"string"};
  var peg$c21 = {"type":"literal","value":"{","description":"\"{\""};
  var peg$c22 = {"type":"literal","value":"}","description":"\"}\""};
  var peg$c23 = {"type":"other","description":"function name"};
  var peg$c24 = {"type":"literal","value":"(","description":"\"(\""};
  var peg$c25 = {"type":"other","description":"FuncParam"};
  var peg$c26 = {"type":"literal","value":")","description":"\")\""};
  var peg$c27 = {"type":"other","description":"Assign"};
  var peg$c28 = {"type":"literal","value":"//","description":"\"//\""};
  var peg$c29 = {"type":"other","description":"Pattern"};
  var peg$c30 = {"type":"literal","value":"?//","description":"\"?//\""};
  var peg$c31 = {"type":"other","description":"name"};
  var peg$c32 = {"type":"literal","value":",","description":"\",\""};
  var peg$c33 = {"type":"other","description":"CommaRHS"};
  var peg$c34 = {"type":"other","description":"DictPair"};
  var peg$c35 = {"type":"other","description":"Or"};
  var peg$c36 = {"type":"other","description":"AssignOp"};
  var peg$c37 = {"type":"literal","value":"[","description":"\"[\""};
  var peg$c38 = {"type":"literal","value":"]","description":"\"]\""};
  var peg$c39 = {"type":"other","description":"ObjPat"};
  var peg$c40 = {"type":"other","description":"DictKey"};
  var peg$c41 = {"type":"other","description":"DictExpr"};
  var peg$c42 = {"type":"other","description":"FieldName"};
  var peg$c43 = {"type":"literal","value":"$__loc__","description":"\"$__loc__\""};
  var peg$c44 = {"type":"other","description":"And"};
  var peg$c45 = {"type":"literal","value":"or","description":"\"or\""};
  var peg$c46 = {"type":"other","description":"assignment operator"};
  var peg$c47 = {"type":"other","description":"ObjPatKey"};
  var peg$c48 = {"type":"other","description":"field name"};
  var peg$c49 = {"type":"other","description":"Cmp"};
  var peg$c50 = {"type":"literal","value":"and","description":"\"and\""};
  var peg$c51 = {"type":"other","description":"Add"};
  var peg$c52 = {"type":"other","description":"CmpOp"};
  var peg$c53 = {"type":"other","description":"Mul"};
  var peg$c54 = {"type":"class","value":"\"+\" or \"-\"","description":"\"+\" or \"-\""};
  var peg$c55 = {"type":"other","description":"comparison operator"};
  var peg$c56 = {"type":"other","description":"Postfix"};
  var peg$c57 = {"type":"other","description":"MulOp"};
  var peg$c58 = {"type":"other","description":"Term"};
  var peg$c59 = {"type":"other","description":"Suffix"};
  var peg$c60 = {"type":"other","description":"multiplicative operator"};
  var peg$c61 = {"type":"literal","value":"..","description":"\"..\""};
  var peg$c62 = {"type":"literal","value":".","description":"\".\""};
  var peg$c63 = {"type":"literal","value":"-","description":"\"-\""};
  var peg$c64 = {"type":"other","description":"Number"};
  var peg$c65 = {"type":"literal","value":"null","description":"\"null\""};
  var peg$c66 = {"type":"literal","value":"true","description":"\"true\""};
  var peg$c67 = {"type":"literal","value":"false","description":"\"false\""};
  var peg$c68 = {"type":"literal","value":"@","description":"\"@\""};
  var peg$c69 = {"type":"literal","value":"if","description":"\"if\""};
  var peg$c70 = {"type":"literal","value":"then","description":"\"then\""};
  var peg$c71 = {"type":"other","description":"ElseBody"};
  var peg$c72 = {"type":"literal","value":"try","description":"\"try\""};
  var peg$c73 = {"type":"other","description":"TryCatch"};
  var peg$c74 = {"type":"literal","value":"reduce","description":"\"reduce\""};
  var peg$c75 = {"type":"literal","value":"foreach","description":"\"foreach\""};
  var peg$c76 = {"type":"other","description":"ForeachExtract"};
  var peg$c77 = {"type":"literal","value":"break","description":"\"break\""};
  var peg$c78 = {"type":"literal","value":"?","description":"\"?\""};
  var peg$c79 = {"type":"other","description":"number"};
  var peg$c80 = {"type":"literal","value":"elif","description":"\"elif\""};
  var peg$c81 = {"type":"literal","value":"else","description":"\"else\""};
  var peg$c82 = {"type":"literal","value":"end","description":"\"end\""};
  var peg$c83 = {"type":"literal","value":"catch","description":"\"catch\""};

  // actions
  function peg$a0(path, alias, meta, rest) {
   return { type: 'import', path: path, alias: alias,
                 meta: meta, rest: rest }; 
  }
  function peg$a1(path, meta, rest) {
   return { type: 'include', path: path, meta: meta, rest: rest }; 
  }
  function peg$a2(meta, rest) {
   return { type: 'module', meta: meta, rest: rest }; 
  }
  function peg$a3(name, params, body, rest) {
   return { type: 'def', name: name, params: params,
                 body: body, rest: rest }; 
  }
  function peg$a4(src, pat, body) {
   return { type: 'bind', expr: src, pattern: pat, body: body }; 
  }
  function peg$a5(name, body) {
   return { type: 'label', name: name, body: body }; 
  }
  function peg$a6(left, right) {
   return build( left, right, 'pipe' ); 
  }
  function peg$a7(fmt, parts) {
  
          if ( fmt === null && count( parts ) === 1 && parts[0]['type'] === 'str_text' ) {
              return { type: 'literal', value: parts[0]['text'] };
          }
          return { type: 'string', fmt: fmt, parts: parts };
      
  }
  function peg$a8(chars) {
   return { type: 'literal', value: strJoin( chars ) }; 
  }
  function peg$a9(first, rest) {
   return [ first, ...rest ]; 
  }
  function peg$a10() {
   return [/*array*/]; 
  }
  function peg$a11(left, right) {
   return build( left, right, 'alternative' ); 
  }
  function peg$a12(first, rest) {
  
          if ( count(rest) === 0 ) {
              return first;
          }
          return { type: 'alt_pattern', patterns: [ first, ...rest ] };
      
  }
  function peg$a13(first, rest) {
     return foldLeft( first, rest, 'comma' ); 
  }
  function peg$a14(slashes) {
   return (strlen(slashes)%2)===1; 
  }
  function peg$a15(expr) {
   return { type: 'str_interp', expr: expr }; 
  }
  function peg$a16(chars) {
   return { type: 'str_text', text: strJoin( chars ) }; 
  }
  function peg$a17(c) {
   return unescapeCStr( c ); 
  }
  function peg$a18(c) {
   return decodeUnicodeEscape( c ); 
  }
  function peg$a19(name) {
   return { kind: 'value', name: name }; 
  }
  function peg$a20(name) {
   return { kind: 'filter', name: name }; 
  }
  function peg$a21(left, right) {
   return buildOp( left, right, 'assign' ); 
  }
  function peg$a22(name) {
   return { type: 'var_pattern', name: name }; 
  }
  function peg$a23(first, rest) {
   return { type: 'array_pattern', elems: [ first, ...rest ] }; 
  }
  function peg$a24(first, rest) {
   return { type: 'obj_pattern', fields: [ first, ...rest ] }; 
  }
  function peg$a25(key, val) {
   return { key: key, value: val }; 
  }
  function peg$a26(name, val) {
   return { key: { type: 'variable', name: name }, value: val }; 
  }
  function peg$a27(name) {
   return { key: { type: 'literal', value: name },
                 value: { type: 'field',
                              expr: { type: 'identity' },
                              name: name, opt: false } }; 
  }
  function peg$a28(name) {
   return { key: name,
                 value: { type: 'index',
                              key: name, opt: false } }; 
  }
  function peg$a29() {
   return { key: { type: 'literal', value: "__loc__" },
                 value: { type: 'literal', value: makeLoc() } }; 
  }
  function peg$a30(name) {
   return { key: { type: 'literal', value: name },
                 value: { type: 'variable', name: name } }; 
  }
  function peg$a31(first, rest) {
   return foldLeft( first, rest, 'or' ); 
  }
  function peg$a32(name, pat) {
   return { key: { type: 'literal', value: name },
                 pattern: { type: 'and_pattern',
                                patterns: [
                                  { type: 'var_pattern', name: name },
                                  pat ] } }; 
  }
  function peg$a33(key, pat) {
   return { key: key, pattern: pat }; 
  }
  function peg$a34(name) {
   return { key: { type: 'literal', value: name },
                 pattern: { type: 'var_pattern', name: name } }; 
  }
  function peg$a35(name) {
   return { type: 'literal', value: name }; 
  }
  function peg$a36(first, rest) {
   return foldLeft( first, rest, 'and' ); 
  }
  function peg$a37(left, right) {
   return buildOp( left, right, 'compare' ); 
  }
  function peg$a38(first, rest) {
   return foldLeftOp( first, rest, 'binop' ); 
  }
  function peg$a39(expr, suffixes) {
   return buildPostfix( expr, suffixes ); 
  }
  function peg$a40() {
   return { type: 'call', name: 'recurse', args: [/*array*/] }; 
  }
  function peg$a41(name, opt) {
   return { type: 'field',
                 expr: { type: 'identity' },
                 name: name, opt: opt }; 
  }
  function peg$a42(name, opt) {
   return { type: 'index', key: name,
                 expr: { type: 'identity' }, opt: opt }; 
  }
  function peg$a43() {
   return { type: 'identity' }; 
  }
  function peg$a44(t) {
   return { type: 'neg', expr: t }; 
  }
  function peg$a45(expr) {
   return { type: 'array', expr: expr }; 
  }
  function peg$a46() {
   return { type: 'array', expr: null }; 
  }
  function peg$a47(pairs) {
   return { type: 'object', pairs: pairs }; 
  }
  function peg$a48() {
   return { type: 'literal', value: null }; 
  }
  function peg$a49() {
   return { type: 'literal', value: true }; 
  }
  function peg$a50() {
   return { type: 'literal', value: false }; 
  }
  function peg$a51() {
  
      return { type: 'literal', value: makeLoc() };
    
  }
  function peg$a52(fmt) {
   return { type: 'format', fmt: fmt }; 
  }
  function peg$a53(name) {
   return { type: 'variable', name: name }; 
  }
  function peg$a54(cond, then, elseBody) {
   return { type: 'if', cond: cond, then: then, else: elseBody }; 
  }
  function peg$a55(body, catch_) {
   return { type: 'try', body: body, catch: catch_ }; 
  }
  function peg$a56(src, pat, init, update) {
   return { type: 'reduce', src: src, pattern: pat,
                 init: init, update: update }; 
  }
  function peg$a57(src, pat, init, update, extract) {
   return { type: 'foreach', src: src, pattern: pat,
                 init: init, update: update, extract: extract }; 
  }
  function peg$a58(name) {
   return { type: 'break', name: name }; 
  }
  function peg$a59(name, args) {
   return { type: 'call', name: name, args: args }; 
  }
  function peg$a60(name) {
   return { type: 'call', name: name, args: [/*array*/] }; 
  }
  function peg$a61() {
   return { type: 'try', catch: null }; 
  }
  function peg$a62(opt) {
   return { type: 'iter', opt: opt }; 
  }
  function peg$a63(from, to, opt) {
   return { type: 'slice', from: from, to: to, opt: opt }; 
  }
  function peg$a64(key, opt) {
   return { type: 'index', key: key, opt: opt }; 
  }
  function peg$a65(name, opt) {
   return { type: 'field', name: name, opt: opt }; 
  }
  function peg$a66(name, opt) {
   return { type: 'index', key: name, opt: opt }; 
  }
  function peg$a67() {
   return true; 
  }
  function peg$a68() {
   return false; 
  }
  function peg$a69(n) {
   return { type: 'literal', value: intVal( n ) }; 
  }
  function peg$a70(n) {
   return { type: 'literal', value: floatVal( n ) }; 
  }
  function peg$a71(cond, then, rest) {
   return { type: 'if', cond: cond, then: then, else: rest }; 
  }
  function peg$a72(body) {
   return body; 
  }

  // initializer
   // JavaScript
      /**
       * PEG grammar for the JQ expression language.
       * Translated from jqlang/jq src/parser.y.
       */
  
      /** Build a `$__loc__` object for the current parse position. */
      function makeLoc() {
          return { file: options.filename ?? '<top-level>', line: location().start.line };
      }
  
      /** Wrap left/right in a binary node, or return left if right is absent. */
      function build(left, right, type) {
          if (right === null) { return left; }
          return { type: type, left: left, right: right };
      }
  
      /** Like build(), but right is [op, operand] and the node gets an 'op' key. */
      function buildOp(left, right, type) {
          if (right === null) { return left; }
          return { type: type, op: right[0], left: left, right: right[1] };
      }
  
      /** Left-fold a list of [op, operand] pairs into a left-associative op tree. */
      function foldLeftOp(first, rest, type) {
          var node = first;
          for (var i = 0; i < rest.length; i++) {
              node = { type: type, op: rest[i][0], left: node, right: rest[i][1] };
          }
          return node;
      }
  
      /** Left-fold a list of operands into a left-associative binary tree. */
      function foldLeft(first, rest, type) {
          var node = first;
          for (var i = 0; i < rest.length; i++) {
              node = { type: type, left: node, right: rest[i] };
          }
          return node;
      }
  
      /** Attach one postfix suffix to an expression node. */
      function applyPostfix(expr, suffix) {
          if (suffix.type === 'try') {
              return { type: 'try', body: expr, catch: suffix.catch };
          }
          return Object.assign({}, suffix, { expr: expr });
      }
  
      /** Apply a list of postfix suffixes left-to-right to an expression. */
      function buildPostfix(expr, suffixes) {
          var node = expr;
          for (var i = 0; i < suffixes.length; i++) {
              node = applyPostfix(node, suffixes[i]);
          }
          return node;
      }
  
      /** Concatenate an array of single characters into a string. */
      function strJoin(chars) {
          return chars.join('');
      }
  
      var escapes = {
          a: '\x07', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t',
      };
  
      /** Decode a C-style backslash escape sequence (e.g. `\n`, `\t`). */
      function unescapeCStr(c) {
          return escapes[c[1]] || c[1];
      }
  
      /** Decode a `\uXXXX` Unicode escape to a UTF-8 character. */
      function decodeUnicodeEscape(c) {
          return JSON.parse('"' + c + '"');
      }
  
      /** Parse a decimal integer string to an int. */
      function intVal(n) {
          return parseInt(n, 10);
      }
  
      /** Parse a decimal number string to a float. */
      function floatVal(n) {
          return parseFloat(n);
      }
  
      /** Return the number of elements in an array. */
      function count(arr) {
          return arr.length;
      }
  
      /** Return the length of a string in characters. */
      function strlen(s) {
          return s.length;
      }
  

  // generated
  function peg$parsestart(silence) {
    var r1,p2,p3;
    seq_1: {
    p2 = peg$currPos;
    peg$discard_();
    seq_2: {
    p3 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      { peg$fail(peg$c1); }
      r1 = peg$FAILED;
      break seq_2;
    }
    r1 = peg$parsePipe(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p3
    peg$discard_();
    } // seq_1
    // free r4
    // free p2
    return r1;
  }
  function peg$discard_() {
    var r1,r2,p3;
    for (;;) {
      choice_1: {
      r2 = /[\t\n\r ]+/y;
      r2.lastIndex = peg$currPos;
      if (r2.exec(input) !== null) {
        peg$currPos = r2.lastIndex;
        break choice_1;
      } else {
        r2 = peg$FAILED;
      }
      seq_1: {
      p3 = peg$currPos;
      if (/^[#]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p3;
      } else {
        r2 = peg$FAILED;
        break seq_1;
      }
      r2 = peg$discardLineComment();
      if (r2===peg$FAILED) {
        peg$currPos = p3;
        r2 = peg$FAILED;
        break seq_1;
      }
      } // seq_1
      // free p3
      } // choice_1
      if (r2===peg$FAILED) {
        break;
      }
    }
    // free r2
    // free r4
    r1 = true;
    // free r1
    return r1;
  }
  function peg$parsePipe(silence) {
    var r1,p2,p3,r4,r5,p6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r23,r24,r25,r27,r28,p29;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,6) === "import") {
      r4 = true;
      peg$currPos += 6;
    } else {
      if (!silence) { peg$fail(peg$c2); }
      r4 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_1;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r5 = true;
    } else {
      r5 = peg$FAILED;
    }
    if (r5 === peg$FAILED) {
      r5 = void 0;
    } else {
      r5 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    seq_2: {
    p6 = peg$currPos;
    if (/^["'@]/.test(input.charAt(peg$currPos))) {
      r8 = true;
      r8 = void 0;
      peg$currPos = p6;
    } else {
      r8 = peg$FAILED;
      if (!silence) { peg$fail(peg$c3); }
      r7 = peg$FAILED;
      break seq_2;
    }
    r7 = peg$parseString(silence);
    if (r7===peg$FAILED) {
      peg$currPos = p6;
      r7 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // path <- r7
    if (r7===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    if (input.substr(peg$currPos,2) === "as") {
      r9 = true;
      peg$currPos += 2;
    } else {
      if (!silence) { peg$fail(peg$c4); }
      r9 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r10 = true;
    } else {
      r10 = peg$FAILED;
    }
    if (r10 === peg$FAILED) {
      r10 = void 0;
    } else {
      r10 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    seq_3: {
    p6 = peg$currPos;
    if (/^[$A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r12 = true;
      r12 = void 0;
      peg$currPos = p6;
    } else {
      r12 = peg$FAILED;
      if (!silence) { peg$fail(peg$c5); }
      r11 = peg$FAILED;
      break seq_3;
    }
    r11 = peg$parseImportAlias(silence);
    if (r11===peg$FAILED) {
      peg$currPos = p6;
      r11 = peg$FAILED;
      break seq_3;
    }
    } // seq_3
    // alias <- r11
    if (r11===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    seq_4: {
    p6 = peg$currPos;
    if (/^[{]/.test(input.charAt(peg$currPos))) {
      r14 = true;
      r14 = void 0;
      peg$currPos = p6;
    } else {
      r14 = peg$FAILED;
      if (!silence) { peg$fail(peg$c6); }
      r13 = peg$FAILED;
      break seq_4;
    }
    r13 = peg$parseImportMeta(silence);
    if (r13===peg$FAILED) {
      peg$currPos = p6;
      r13 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    if (r13===peg$FAILED) {
      r13 = null;
    }
    // free p6
    // meta <- r13
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 59) {
      r15 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c7); }
      r15 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    seq_5: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r17 = true;
      r17 = void 0;
      peg$currPos = p6;
    } else {
      r17 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r16 = peg$FAILED;
      break seq_5;
    }
    r16 = peg$parsePipe(silence);
    if (r16===peg$FAILED) {
      peg$currPos = p6;
      r16 = peg$FAILED;
      break seq_5;
    }
    } // seq_5
    // rest <- r16
    if (r16===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a0(r7, r11, r13, r16);
      break choice_1;
    }
    // free r4,r5,r8,r9,r10,r12,r14,r15,r17
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_6: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,7) === "include") {
      r17 = true;
      peg$currPos += 7;
    } else {
      if (!silence) { peg$fail(peg$c8); }
      r17 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_6;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r15 = true;
    } else {
      r15 = peg$FAILED;
    }
    if (r15 === peg$FAILED) {
      r15 = void 0;
    } else {
      r15 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_6;
    }
    // free p6
    peg$discard_();
    seq_7: {
    p6 = peg$currPos;
    if (/^["'@]/.test(input.charAt(peg$currPos))) {
      r12 = true;
      r12 = void 0;
      peg$currPos = p6;
    } else {
      r12 = peg$FAILED;
      if (!silence) { peg$fail(peg$c3); }
      r14 = peg$FAILED;
      break seq_7;
    }
    r14 = peg$parseString(silence);
    if (r14===peg$FAILED) {
      peg$currPos = p6;
      r14 = peg$FAILED;
      break seq_7;
    }
    } // seq_7
    // path <- r14
    if (r14===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_6;
    }
    // free p6
    peg$discard_();
    seq_8: {
    p6 = peg$currPos;
    if (/^[{]/.test(input.charAt(peg$currPos))) {
      r9 = true;
      r9 = void 0;
      peg$currPos = p6;
    } else {
      r9 = peg$FAILED;
      if (!silence) { peg$fail(peg$c6); }
      r10 = peg$FAILED;
      break seq_8;
    }
    r10 = peg$parseImportMeta(silence);
    if (r10===peg$FAILED) {
      peg$currPos = p6;
      r10 = peg$FAILED;
      break seq_8;
    }
    } // seq_8
    if (r10===peg$FAILED) {
      r10 = null;
    }
    // free p6
    // meta <- r10
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 59) {
      r8 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c7); }
      r8 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_6;
    }
    peg$discard_();
    seq_9: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r4 = true;
      r4 = void 0;
      peg$currPos = p6;
    } else {
      r4 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r5 = peg$FAILED;
      break seq_9;
    }
    r5 = peg$parsePipe(silence);
    if (r5===peg$FAILED) {
      peg$currPos = p6;
      r5 = peg$FAILED;
      break seq_9;
    }
    } // seq_9
    // rest <- r5
    if (r5===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_6;
    }
    // free p6
    r1 = true;
    } // seq_6
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a1(r14, r10, r5);
      break choice_1;
    }
    // free r17,r15,r12,r9,r8,r4
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_10: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,6) === "module") {
      r4 = true;
      peg$currPos += 6;
    } else {
      if (!silence) { peg$fail(peg$c9); }
      r4 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_10;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r8 = true;
    } else {
      r8 = peg$FAILED;
    }
    if (r8 === peg$FAILED) {
      r8 = void 0;
    } else {
      r8 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_10;
    }
    // free p6
    peg$discard_();
    seq_11: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r12 = true;
      r12 = void 0;
      peg$currPos = p6;
    } else {
      r12 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r9 = peg$FAILED;
      break seq_11;
    }
    r9 = peg$parsePipe(silence);
    if (r9===peg$FAILED) {
      peg$currPos = p6;
      r9 = peg$FAILED;
      break seq_11;
    }
    } // seq_11
    // meta <- r9
    if (r9===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_10;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 59) {
      r15 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c7); }
      r15 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_10;
    }
    peg$discard_();
    seq_12: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r18 = true;
      r18 = void 0;
      peg$currPos = p6;
    } else {
      r18 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r17 = peg$FAILED;
      break seq_12;
    }
    r17 = peg$parsePipe(silence);
    if (r17===peg$FAILED) {
      peg$currPos = p6;
      r17 = peg$FAILED;
      break seq_12;
    }
    } // seq_12
    // rest <- r17
    if (r17===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_10;
    }
    // free p6
    r1 = true;
    } // seq_10
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a2(r9, r17);
      break choice_1;
    }
    // free r4,r8,r12,r15,r18
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_13: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,3) === "def") {
      r18 = true;
      peg$currPos += 3;
    } else {
      if (!silence) { peg$fail(peg$c10); }
      r18 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_13;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r15 = true;
    } else {
      r15 = peg$FAILED;
    }
    if (r15 === peg$FAILED) {
      r15 = void 0;
    } else {
      r15 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_13;
    }
    // free p6
    peg$discard_();
    seq_14: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r8 = true;
      r8 = void 0;
      peg$currPos = p6;
    } else {
      r8 = peg$FAILED;
      if (!silence) { peg$fail(peg$c11); }
      r12 = peg$FAILED;
      break seq_14;
    }
    r12 = peg$parseFuncName(silence);
    if (r12===peg$FAILED) {
      peg$currPos = p6;
      r12 = peg$FAILED;
      break seq_14;
    }
    } // seq_14
    // name <- r12
    if (r12===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_13;
    }
    // free p6
    peg$discard_();
    r4 = peg$parseFuncParams(silence);
    // params <- r4
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 58) {
      r19 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c12); }
      r19 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_13;
    }
    peg$discard_();
    seq_15: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r21 = true;
      r21 = void 0;
      peg$currPos = p6;
    } else {
      r21 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r20 = peg$FAILED;
      break seq_15;
    }
    r20 = peg$parsePipe(silence);
    if (r20===peg$FAILED) {
      peg$currPos = p6;
      r20 = peg$FAILED;
      break seq_15;
    }
    } // seq_15
    // body <- r20
    if (r20===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_13;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 59) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c7); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_13;
    }
    peg$discard_();
    seq_16: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r24 = true;
      r24 = void 0;
      peg$currPos = p6;
    } else {
      r24 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r23 = peg$FAILED;
      break seq_16;
    }
    r23 = peg$parsePipe(silence);
    if (r23===peg$FAILED) {
      peg$currPos = p6;
      r23 = peg$FAILED;
      break seq_16;
    }
    } // seq_16
    // rest <- r23
    if (r23===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_13;
    }
    // free p6
    r1 = true;
    } // seq_13
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a3(r12, r4, r20, r23);
      break choice_1;
    }
    // free r18,r15,r8,r19,r21,r22,r24
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_17: {
    p3 = peg$currPos;
    seq_18: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c13); }
      r24 = peg$FAILED;
      break seq_18;
    }
    r24 = peg$parseAlt(silence);
    if (r24===peg$FAILED) {
      peg$currPos = p3;
      r24 = peg$FAILED;
      break seq_18;
    }
    } // seq_18
    // src <- r24
    if (r24===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_17;
    }
    peg$discard_();
    if (input.substr(peg$currPos,2) === "as") {
      r21 = true;
      peg$currPos += 2;
    } else {
      if (!silence) { peg$fail(peg$c4); }
      r21 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_17;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r19 = true;
    } else {
      r19 = peg$FAILED;
    }
    if (r19 === peg$FAILED) {
      r19 = void 0;
    } else {
      r19 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_17;
    }
    // free p6
    peg$discard_();
    seq_19: {
    p6 = peg$currPos;
    if (/^[$[{]/.test(input.charAt(peg$currPos))) {
      r15 = true;
      r15 = void 0;
      peg$currPos = p6;
    } else {
      r15 = peg$FAILED;
      if (!silence) { peg$fail(peg$c14); }
      r8 = peg$FAILED;
      break seq_19;
    }
    r8 = peg$parsePatterns(silence);
    if (r8===peg$FAILED) {
      peg$currPos = p6;
      r8 = peg$FAILED;
      break seq_19;
    }
    } // seq_19
    // pat <- r8
    if (r8===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_17;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 124) {
      r18 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c15); }
      r18 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_17;
    }
    peg$discard_();
    seq_20: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r25 = peg$FAILED;
      break seq_20;
    }
    r25 = peg$parsePipe(silence);
    if (r25===peg$FAILED) {
      peg$currPos = p6;
      r25 = peg$FAILED;
      break seq_20;
    }
    } // seq_20
    // body <- r25
    if (r25===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_17;
    }
    // free p6
    r1 = true;
    } // seq_17
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a4(r24, r8, r25);
      break choice_1;
    }
    // free r22,r21,r19,r15,r18,r26
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_21: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,5) === "label") {
      peg$currPos += 5;
    } else {
      if (!silence) { peg$fail(peg$c16); }
      r1 = peg$FAILED;
      break seq_21;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r18 = true;
    } else {
      r18 = peg$FAILED;
    }
    if (r18 === peg$FAILED) {
      r18 = void 0;
    } else {
      r18 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_21;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 36) {
      r15 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c17); }
      r15 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_21;
    }
    seq_22: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r21 = true;
      r21 = void 0;
      peg$currPos = p6;
    } else {
      r21 = peg$FAILED;
      if (!silence) { peg$fail(peg$c18); }
      r19 = peg$FAILED;
      break seq_22;
    }
    r19 = peg$parseName(silence);
    if (r19===peg$FAILED) {
      peg$currPos = p6;
      r19 = peg$FAILED;
      break seq_22;
    }
    } // seq_22
    // name <- r19
    if (r19===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_21;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 124) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c15); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_21;
    }
    peg$discard_();
    seq_23: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r28 = true;
      r28 = void 0;
      peg$currPos = p6;
    } else {
      r28 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r27 = peg$FAILED;
      break seq_23;
    }
    r27 = peg$parsePipe(silence);
    if (r27===peg$FAILED) {
      peg$currPos = p6;
      r27 = peg$FAILED;
      break seq_23;
    }
    } // seq_23
    // body <- r27
    if (r27===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_21;
    }
    // free p6
    r1 = true;
    } // seq_21
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a5(r19, r27);
      break choice_1;
    }
    // free r26,r18,r15,r21,r22,r28
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_24: {
    p3 = peg$currPos;
    seq_25: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c19); }
      r28 = peg$FAILED;
      break seq_25;
    }
    r28 = peg$parseComma(silence);
    if (r28===peg$FAILED) {
      peg$currPos = p3;
      r28 = peg$FAILED;
      break seq_25;
    }
    } // seq_25
    // left <- r28
    if (r28===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_24;
    }
    seq_26: {
    p6 = peg$currPos;
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 124) {
      r15 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c15); }
      r15 = peg$FAILED;
      peg$currPos = p6;
      r21 = peg$FAILED;
      break seq_26;
    }
    peg$discard_();
    seq_27: {
    p29 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r18 = true;
      r18 = void 0;
      peg$currPos = p29;
    } else {
      r18 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r21 = peg$FAILED;
      break seq_27;
    }
    r21 = peg$parsePipe(silence);
    if (r21===peg$FAILED) {
      peg$currPos = p29;
      r21 = peg$FAILED;
      break seq_27;
    }
    } // seq_27
    if (r21===peg$FAILED) {
      peg$currPos = p6;
      r21 = peg$FAILED;
      break seq_26;
    }
    // free p29
    } // seq_26
    if (r21===peg$FAILED) {
      r21 = null;
    }
    // free r18
    // free p6
    // right <- r21
    r1 = true;
    } // seq_24
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a6(r28, r21);
    }
    // free r22,r15
    // free p3
    // free p2
    } // choice_1
    return r1;
  }
  function peg$discardLineComment() {
    var r1,r5,p6;
    seq_1: {
    if (input.charCodeAt(peg$currPos) === 35) {
      peg$currPos += 1;
    } else {
      r1 = peg$FAILED;
      break seq_1;
    }
    for (;;) {
      choice_1: {
      seq_2: {
      p6 = peg$currPos;
      if (/^[\\]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p6;
      } else {
        r5 = peg$FAILED;
        break seq_2;
      }
      r5 = peg$discardEscapedNewline();
      if (r5===peg$FAILED) {
        peg$currPos = p6;
        r5 = peg$FAILED;
        break seq_2;
      }
      } // seq_2
      if (r5!==peg$FAILED) {
        break choice_1;
      }
      // free p6
      if (/^[^\n]/.test(input.charAt(peg$currPos))) {
        r5 = true;
        peg$currPos++;
      } else {
        r5 = peg$FAILED;
      }
      } // choice_1
      if (r5===peg$FAILED) {
        break;
      }
    }
    // free r4
    r1 = true;
    } // seq_1
    // free r3
    // free p2
    return r1;
  }
  function peg$parseString(silence) {
    var r1,p2,p3,r4,r5,p6,r7,r8,r9,r10;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (input.charCodeAt(peg$currPos) === 64) {
      r5 = true;
      peg$currPos += 1;
    } else {
      r5 = peg$FAILED;
      r4 = peg$FAILED;
      break seq_2;
    }
    seq_3: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r7 = true;
      r7 = void 0;
      peg$currPos = p6;
    } else {
      r7 = peg$FAILED;
      r4 = peg$FAILED;
      break seq_3;
    }
    r4 = peg$parseName(true);
    if (r4===peg$FAILED) {
      peg$currPos = p6;
      r4 = peg$FAILED;
      break seq_3;
    }
    } // seq_3
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    // free p6
    peg$discard_();
    } // seq_2
    if (r4===peg$FAILED) {
      r4 = null;
    }
    // free r7
    // fmt <- r4
    if (input.charCodeAt(peg$currPos) === 34) {
      r7 = true;
      peg$currPos += 1;
    } else {
      r7 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    r8 = [];
    for (;;) {
      r9 = peg$parseQQPart();
      if (r9!==peg$FAILED) {
        r8.push(r9);
      } else {
        break;
      }
    }
    // parts <- r8
    // free r9
    if (input.charCodeAt(peg$currPos) === 34) {
      r9 = true;
      peg$currPos += 1;
    } else {
      r9 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a7(r4, r8);
      break choice_1;
    }
    // free r5,r7,r9
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_4: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 39) {
      r9 = true;
      peg$currPos += 1;
    } else {
      r9 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_4;
    }
    r7 = [];
    for (;;) {
      seq_5: {
      p6 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        r10 = true;
      } else {
        r10 = peg$FAILED;
      }
      if (r10 === peg$FAILED) {
        r10 = void 0;
      } else {
        r10 = peg$FAILED;
        peg$currPos = p6;
        r5 = peg$FAILED;
        break seq_5;
      }
      r5 = peg$parseSingleChar();
      if (r5===peg$FAILED) {
        peg$currPos = p6;
        r5 = peg$FAILED;
        break seq_5;
      }
      } // seq_5
      if (r5!==peg$FAILED) {
        r7.push(r5);
      } else {
        break;
      }
      // free p6
    }
    // chars <- r7
    // free r5
    // free r10
    if (input.charCodeAt(peg$currPos) === 39) {
      r10 = true;
      peg$currPos += 1;
    } else {
      r10 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_4;
    }
    r1 = true;
    } // seq_4
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a8(r7);
    }
    // free r9,r10
    // free p3
    // free p2
    } // choice_1
    if (r1===peg$FAILED) {
      if (!silence) { peg$fail(peg$c20); }
    }
    return r1;
  }
  function peg$parseImportAlias(silence) {
    var r1,p2,p4;
    choice_1: {
    seq_1: {
    p2 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 36) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c17); }
      r1 = peg$FAILED;
      break seq_1;
    }
    seq_2: {
    p4 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p4;
    } else {
      if (!silence) { peg$fail(peg$c18); }
      r1 = peg$FAILED;
      break seq_2;
    }
    r1 = peg$parseName(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p4;
      r1 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p4
    } // seq_1
    if (r1!==peg$FAILED) {
      break choice_1;
    }
    // free r5
    // free p2
    seq_3: {
    p2 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p2;
    } else {
      if (!silence) { peg$fail(peg$c18); }
      r1 = peg$FAILED;
      break seq_3;
    }
    r1 = peg$parseName(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_3;
    }
    } // seq_3
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseImportMeta(silence) {
    var r1,p2;
    seq_1: {
    p2 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 123) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c21); }
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    r1 = peg$parseDictPairs(silence);
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 125) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c22); }
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    } // seq_1
    // free p2
    return r1;
  }
  function peg$parseFuncName(silence) {
    var r1,p2,r3,r4,r5,p6;
    seq_1: {
    p2 = peg$currPos;
    seq_2: {
    choice_1: {
    if (input.substr(peg$currPos,2) === "if") {
      r4 = true;
      peg$currPos += 2;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,4) === "then") {
      r4 = true;
      peg$currPos += 4;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,4) === "else") {
      r4 = true;
      peg$currPos += 4;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,4) === "elif") {
      r4 = true;
      peg$currPos += 4;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,3) === "end") {
      r4 = true;
      peg$currPos += 3;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,3) === "and") {
      r4 = true;
      peg$currPos += 3;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,2) === "or") {
      r4 = true;
      peg$currPos += 2;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,3) === "try") {
      r4 = true;
      peg$currPos += 3;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,5) === "catch") {
      r4 = true;
      peg$currPos += 5;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,6) === "reduce") {
      r4 = true;
      peg$currPos += 6;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,7) === "foreach") {
      r4 = true;
      peg$currPos += 7;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,5) === "label") {
      r4 = true;
      peg$currPos += 5;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,5) === "break") {
      r4 = true;
      peg$currPos += 5;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,2) === "as") {
      r4 = true;
      peg$currPos += 2;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,3) === "def") {
      r4 = true;
      peg$currPos += 3;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,6) === "import") {
      r4 = true;
      peg$currPos += 6;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,7) === "include") {
      r4 = true;
      peg$currPos += 7;
      break choice_1;
    } else {
      r4 = peg$FAILED;
    }
    if (input.substr(peg$currPos,6) === "module") {
      r4 = true;
      peg$currPos += 6;
    } else {
      r4 = peg$FAILED;
    }
    } // choice_1
    if (r4===peg$FAILED) {
      r3 = peg$FAILED;
      break seq_2;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r5 = true;
    } else {
      r5 = peg$FAILED;
    }
    if (r5 === peg$FAILED) {
      r5 = void 0;
    } else {
      r5 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p2;
      r3 = peg$FAILED;
      break seq_2;
    }
    // free p6
    r3 = true;
    } // seq_2
    // free r4,r5
    if (r3 === peg$FAILED) {
      r3 = void 0;
    } else {
      r3 = peg$FAILED;
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    seq_3: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r5 = true;
      r5 = void 0;
      peg$currPos = p6;
    } else {
      r5 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_3;
    }
    r1 = peg$parseName(true);
    if (r1===peg$FAILED) {
      peg$currPos = p6;
      r1 = peg$FAILED;
      break seq_3;
    }
    } // seq_3
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    } // seq_1
    if (r1===peg$FAILED) {
      if (!silence) { peg$fail(peg$c23); }
    }
    // free r5
    // free p2
    return r1;
  }
  function peg$parseFuncParams(silence) {
    var r1,p2,p3,r5,p6,r8,r9,p11;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c24); }
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    seq_2: {
    p6 = peg$currPos;
    if (/^[$A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c25); }
      r5 = peg$FAILED;
      break seq_2;
    }
    r5 = peg$parseFuncParam(silence);
    if (r5===peg$FAILED) {
      peg$currPos = p6;
      r5 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // first <- r5
    if (r5===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    r8 = [];
    for (;;) {
      seq_3: {
      p6 = peg$currPos;
      peg$discard_();
      if (input.charCodeAt(peg$currPos) === 59) {
        peg$currPos += 1;
      } else {
        if (!silence) { peg$fail(peg$c7); }
        peg$currPos = p6;
        r9 = peg$FAILED;
        break seq_3;
      }
      peg$discard_();
      seq_4: {
      p11 = peg$currPos;
      if (/^[$A-Z_a-z]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p11;
      } else {
        if (!silence) { peg$fail(peg$c25); }
        r9 = peg$FAILED;
        break seq_4;
      }
      r9 = peg$parseFuncParam(silence);
      if (r9===peg$FAILED) {
        peg$currPos = p11;
        r9 = peg$FAILED;
        break seq_4;
      }
      } // seq_4
      if (r9===peg$FAILED) {
        peg$currPos = p6;
        r9 = peg$FAILED;
        break seq_3;
      }
      // free p11
      } // seq_3
      if (r9!==peg$FAILED) {
        r8.push(r9);
      } else {
        break;
      }
      // free r12
      // free p6
    }
    // rest <- r8
    // free r9
    // free r10
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 41) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c26); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a9(r5, r8);
      break choice_1;
    }
    // free r4,r7,r10
    // free p3
    // free p2
    p2 = peg$currPos;
    r1 = true;
    peg$savedPos = p2;
    r1 = peg$a10();
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseAlt(silence) {
    var r1,p2,p3,r4,r6,p7,p9;
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c27); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parseAssign(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // left <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    seq_3: {
    p7 = peg$currPos;
    peg$discard_();
    if (input.substr(peg$currPos,2) === "//") {
      peg$currPos += 2;
    } else {
      if (!silence) { peg$fail(peg$c28); }
      peg$currPos = p7;
      r6 = peg$FAILED;
      break seq_3;
    }
    peg$discard_();
    seq_4: {
    p9 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p9;
    } else {
      if (!silence) { peg$fail(peg$c13); }
      r6 = peg$FAILED;
      break seq_4;
    }
    r6 = peg$parseAlt(silence);
    if (r6===peg$FAILED) {
      peg$currPos = p9;
      r6 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    if (r6===peg$FAILED) {
      peg$currPos = p7;
      r6 = peg$FAILED;
      break seq_3;
    }
    // free p9
    } // seq_3
    if (r6===peg$FAILED) {
      r6 = null;
    }
    // free r10
    // free p7
    // right <- r6
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a11(r4, r6);
    }
    // free r5,r8
    // free p3
    // free p2
    return r1;
  }
  function peg$parsePatterns(silence) {
    var r1,p2,p3,r4,r6,r7,p8,p10;
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^[$[{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c29); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parsePattern(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // first <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    r6 = [];
    for (;;) {
      seq_3: {
      p8 = peg$currPos;
      peg$discard_();
      if (input.substr(peg$currPos,3) === "?//") {
        peg$currPos += 3;
      } else {
        if (!silence) { peg$fail(peg$c30); }
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      peg$discard_();
      seq_4: {
      p10 = peg$currPos;
      if (/^[$[{]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p10;
      } else {
        if (!silence) { peg$fail(peg$c29); }
        r7 = peg$FAILED;
        break seq_4;
      }
      r7 = peg$parsePattern(silence);
      if (r7===peg$FAILED) {
        peg$currPos = p10;
        r7 = peg$FAILED;
        break seq_4;
      }
      } // seq_4
      if (r7===peg$FAILED) {
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p10
      } // seq_3
      if (r7!==peg$FAILED) {
        r6.push(r7);
      } else {
        break;
      }
      // free r11
      // free p8
    }
    // rest <- r6
    // free r7
    // free r9
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a12(r4, r6);
    }
    // free r5
    // free p3
    // free p2
    return r1;
  }
  function peg$parseName(silence) {
    var p1,r2,r5,r7,p8,r11;
    p1 = peg$currPos;
    seq_1: {
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos++;
    } else {
      r2 = peg$FAILED;
      break seq_1;
    }
    r5 = /[0-9A-Z_a-z]*/y;
    r5.lastIndex = peg$currPos;
    if (r5.exec(input) !== null) {
      peg$currPos = r5.lastIndex;
    } else {
      r5 = peg$FAILED;
    }
    for (;;) {
      seq_2: {
      p8 = peg$currPos;
      if (input.substr(peg$currPos,2) === "::") {
        peg$currPos += 2;
      } else {
        r7 = peg$FAILED;
        break seq_2;
      }
      if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
        peg$currPos++;
      } else {
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_2;
      }
      r11 = /[0-9A-Z_a-z]*/y;
      r11.lastIndex = peg$currPos;
      if (r11.exec(input) !== null) {
        peg$currPos = r11.lastIndex;
      } else {
        r11 = peg$FAILED;
      }
      r7 = true;
      } // seq_2
      if (r7===peg$FAILED) {
        break;
      }
      // free r9,r10,r11
      // free p8
    }
    // free r6
    r2 = true;
    } // seq_1
    if (r2!==peg$FAILED) {
      r2 = input.substring(p1, peg$currPos);
    } else {
      r2 = peg$FAILED;
      if (!silence) { peg$fail(peg$c31); }
    }
    // free r4,r5
    // free p3
    // free p1
    return r2;
  }
  function peg$parseComma(silence) {
    var r1,p2,p3,r4,r6,r7,p8,p10;
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c13); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parseAlt(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // first <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    r6 = [];
    for (;;) {
      seq_3: {
      p8 = peg$currPos;
      peg$discard_();
      if (input.charCodeAt(peg$currPos) === 44) {
        peg$currPos += 1;
      } else {
        if (!silence) { peg$fail(peg$c32); }
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      peg$discard_();
      seq_4: {
      p10 = peg$currPos;
      if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p10;
      } else {
        if (!silence) { peg$fail(peg$c33); }
        r7 = peg$FAILED;
        break seq_4;
      }
      r7 = peg$parseCommaRHS(silence);
      if (r7===peg$FAILED) {
        peg$currPos = p10;
        r7 = peg$FAILED;
        break seq_4;
      }
      } // seq_4
      if (r7===peg$FAILED) {
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p10
      } // seq_3
      if (r7!==peg$FAILED) {
        r6.push(r7);
      } else {
        break;
      }
      // free r11
      // free p8
    }
    // rest <- r6
    // free r7
    // free r9
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a13(r4, r6);
    }
    // free r5
    // free p3
    // free p2
    return r1;
  }
  function peg$discardEscapedNewline() {
    var r1,p2,r3,p4,r6;
    seq_1: {
    p2 = peg$currPos;
    p4 = peg$currPos;
    r3 = peg$FAILED;
    for (;;) {
      if (input.charCodeAt(peg$currPos) === 92) {
        peg$currPos += 1;
        r3 = true;
      } else {
        break;
      }
    }
    // slashes <- r3
    if (r3!==peg$FAILED) {
      r3 = input.substring(p4, peg$currPos);
    } else {
      r3 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free r5
    // free p4
    if (input.charCodeAt(peg$currPos) === 10) {
      peg$currPos += 1;
    } else {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$savedPos = peg$currPos;
    r6 = peg$a14(r3);
    if (r6) {
      r6 = void 0;
    } else {
      r6 = peg$FAILED;
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    r1 = true;
    } // seq_1
    // free p2
    return r1;
  }
  function peg$parseQQPart() {
    var r1,p2,p3,r4,r5,p6,r7,r8,r9;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,2) === "\\(") {
      r4 = true;
      peg$currPos += 2;
    } else {
      r4 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    seq_2: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r7 = true;
      r7 = void 0;
      peg$currPos = p6;
    } else {
      r7 = peg$FAILED;
      r5 = peg$FAILED;
      break seq_2;
    }
    r5 = peg$parsePipe(true);
    if (r5===peg$FAILED) {
      peg$currPos = p6;
      r5 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // expr <- r5
    if (r5===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 41) {
      r8 = true;
      peg$currPos += 1;
    } else {
      r8 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a15(r5);
      break choice_1;
    }
    // free r4,r7,r8
    // free p3
    // free p2
    p2 = peg$currPos;
    r8 = [];
    for (;;) {
      seq_3: {
      p3 = peg$currPos;
      if (input.substr(peg$currPos,2) === "\\(") {
        r4 = true;
      } else {
        r4 = peg$FAILED;
      }
      if (r4 === peg$FAILED) {
        r4 = void 0;
      } else {
        r4 = peg$FAILED;
        peg$currPos = p3;
        r7 = peg$FAILED;
        break seq_3;
      }
      p6 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        r9 = true;
      } else {
        r9 = peg$FAILED;
      }
      if (r9 === peg$FAILED) {
        r9 = void 0;
      } else {
        r9 = peg$FAILED;
        peg$currPos = p6;
        peg$currPos = p3;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p6
      r7 = peg$parseSingleChar();
      if (r7===peg$FAILED) {
        peg$currPos = p3;
        r7 = peg$FAILED;
        break seq_3;
      }
      } // seq_3
      if (r7!==peg$FAILED) {
        r8.push(r7);
      } else {
        break;
      }
      // free p3
    }
    if (r8.length === 0) {
      r8 = peg$FAILED;
    }
    // chars <- r8
    // free r7
    r1 = r8;
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a16(r8);
    }
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseSingleChar() {
    var r1,p2,r3,p4,p5,r7;
    choice_1: {
    p2 = peg$currPos;
    p4 = peg$currPos;
    seq_1: {
    p5 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 92) {
      peg$currPos += 1;
    } else {
      r3 = peg$FAILED;
      break seq_1;
    }
    if (/^["'\\abfnrt]/.test(input.charAt(peg$currPos))) {
      r7 = true;
      peg$currPos++;
    } else {
      r7 = peg$FAILED;
      peg$currPos = p5;
      r3 = peg$FAILED;
      break seq_1;
    }
    r3 = true;
    } // seq_1
    // c <- r3
    if (r3!==peg$FAILED) {
      r3 = input.substring(p4, peg$currPos);
    } else {
      r3 = peg$FAILED;
    }
    // free r6,r7
    // free p5
    // free p4
    r1 = r3;
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a17(r3);
      break choice_1;
    }
    // free p2
    p2 = peg$currPos;
    p4 = peg$currPos;
    seq_2: {
    p5 = peg$currPos;
    if (input.substr(peg$currPos,2) === "\\u") {
      peg$currPos += 2;
    } else {
      r7 = peg$FAILED;
      break seq_2;
    }
    if (/^[0-9A-Fa-f]/.test(input.charAt(peg$currPos))) {
      peg$currPos++;
    } else {
      peg$currPos = p5;
      r7 = peg$FAILED;
      break seq_2;
    }
    seq_3: {
    if (/^[0-9A-Fa-f]/.test(input.charAt(peg$currPos))) {
      peg$currPos++;
    } else {
      break seq_3;
    }
    seq_4: {
    if (/^[0-9A-Fa-f]/.test(input.charAt(peg$currPos))) {
      peg$currPos++;
    } else {
      break seq_4;
    }
    if (/^[0-9A-Fa-f]/.test(input.charAt(peg$currPos))) {
      peg$currPos++;
    }
    } // seq_4
    } // seq_3
    // free r11,r12
    // free p10
    r7 = true;
    } // seq_2
    // c <- r7
    if (r7!==peg$FAILED) {
      r7 = input.substring(p4, peg$currPos);
    } else {
      r7 = peg$FAILED;
    }
    // free r6,r8,r9
    // free p5
    // free p4
    r1 = r7;
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a18(r7);
      break choice_1;
    }
    // free p2
    r1 = input.charAt(peg$currPos);
    if (/^[^\\]/.test(r1)) {
      peg$currPos++;
    } else {
      r1 = peg$FAILED;
    }
    } // choice_1
    return r1;
  }
  function peg$parseDictPairs(silence) {
    var r1,p2,p3,r4,r6,r7,p8,p10;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(@-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c34); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parseDictPair(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // first <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    r6 = [];
    for (;;) {
      seq_3: {
      p8 = peg$currPos;
      peg$discard_();
      if (input.charCodeAt(peg$currPos) === 44) {
        peg$currPos += 1;
      } else {
        if (!silence) { peg$fail(peg$c32); }
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      peg$discard_();
      seq_4: {
      p10 = peg$currPos;
      if (/^["$'-(@-Z_a-z]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p10;
      } else {
        if (!silence) { peg$fail(peg$c34); }
        r7 = peg$FAILED;
        break seq_4;
      }
      r7 = peg$parseDictPair(silence);
      if (r7===peg$FAILED) {
        peg$currPos = p10;
        r7 = peg$FAILED;
        break seq_4;
      }
      } // seq_4
      if (r7===peg$FAILED) {
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p10
      } // seq_3
      if (r7!==peg$FAILED) {
        r6.push(r7);
      } else {
        break;
      }
      // free r11
      // free p8
    }
    // rest <- r6
    // free r7
    // free r9
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a9(r4, r6);
      break choice_1;
    }
    // free r5
    // free p3
    // free p2
    p2 = peg$currPos;
    r1 = true;
    peg$savedPos = p2;
    r1 = peg$a10();
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseFuncParam(silence) {
    var r1,p2,p3,r5,p6,r7;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 36) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c17); }
      r1 = peg$FAILED;
      break seq_1;
    }
    seq_2: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r7 = true;
      r7 = void 0;
      peg$currPos = p6;
    } else {
      r7 = peg$FAILED;
      if (!silence) { peg$fail(peg$c18); }
      r5 = peg$FAILED;
      break seq_2;
    }
    r5 = peg$parseName(silence);
    if (r5===peg$FAILED) {
      peg$currPos = p6;
      r5 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // name <- r5
    if (r5===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a19(r5);
      break choice_1;
    }
    // free r4,r7
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_3: {
    p3 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c18); }
      r7 = peg$FAILED;
      break seq_3;
    }
    r7 = peg$parseName(silence);
    if (r7===peg$FAILED) {
      peg$currPos = p3;
      r7 = peg$FAILED;
      break seq_3;
    }
    } // seq_3
    // name <- r7
    // free p3
    r1 = r7;
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a20(r7);
    }
    // free r4
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseAssign(silence) {
    var r1,p2,p3,r4,r6,p7,r8,p9,r11;
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c35); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parseOr(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // left <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    seq_3: {
    p7 = peg$currPos;
    peg$discard_();
    seq_4: {
    p9 = peg$currPos;
    if (/^[%*+\-\/=|]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p9;
    } else {
      if (!silence) { peg$fail(peg$c36); }
      r8 = peg$FAILED;
      break seq_4;
    }
    r8 = peg$parseAssignOp(silence);
    if (r8===peg$FAILED) {
      peg$currPos = p9;
      r8 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    if (r8===peg$FAILED) {
      peg$currPos = p7;
      r6 = peg$FAILED;
      break seq_3;
    }
    // free p9
    peg$discard_();
    seq_5: {
    p9 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p9;
    } else {
      if (!silence) { peg$fail(peg$c35); }
      r11 = peg$FAILED;
      break seq_5;
    }
    r11 = peg$parseOr(silence);
    if (r11===peg$FAILED) {
      peg$currPos = p9;
      r11 = peg$FAILED;
      break seq_5;
    }
    } // seq_5
    if (r11===peg$FAILED) {
      peg$currPos = p7;
      r6 = peg$FAILED;
      break seq_3;
    }
    // free p9
    r6 = [r8,r11];
    } // seq_3
    if (r6===peg$FAILED) {
      r6 = null;
    }
    // free r8,r10,r11,r12
    // free p7
    // right <- r6
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a21(r4, r6);
    }
    // free r5
    // free p3
    // free p2
    return r1;
  }
  function peg$parsePattern(silence) {
    var r1,p2,p3,r4,r5,p6,r8,r9,r10,p12,r13;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 36) {
      r4 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c17); }
      r4 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_1;
    }
    seq_2: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c18); }
      r5 = peg$FAILED;
      break seq_2;
    }
    r5 = peg$parseName(silence);
    if (r5===peg$FAILED) {
      peg$currPos = p6;
      r5 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // name <- r5
    if (r5===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a22(r5);
      break choice_1;
    }
    // free r4,r7
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_3: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 91) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c37); }
      r1 = peg$FAILED;
      break seq_3;
    }
    peg$discard_();
    seq_4: {
    p6 = peg$currPos;
    if (/^[$[{]/.test(input.charAt(peg$currPos))) {
      r8 = true;
      r8 = void 0;
      peg$currPos = p6;
    } else {
      r8 = peg$FAILED;
      if (!silence) { peg$fail(peg$c29); }
      r4 = peg$FAILED;
      break seq_4;
    }
    r4 = peg$parsePattern(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p6;
      r4 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    // first <- r4
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_3;
    }
    // free p6
    r9 = [];
    for (;;) {
      seq_5: {
      p6 = peg$currPos;
      peg$discard_();
      if (input.charCodeAt(peg$currPos) === 44) {
        peg$currPos += 1;
      } else {
        if (!silence) { peg$fail(peg$c32); }
        peg$currPos = p6;
        r10 = peg$FAILED;
        break seq_5;
      }
      peg$discard_();
      seq_6: {
      p12 = peg$currPos;
      if (/^[$[{]/.test(input.charAt(peg$currPos))) {
        r13 = true;
        r13 = void 0;
        peg$currPos = p12;
      } else {
        r13 = peg$FAILED;
        if (!silence) { peg$fail(peg$c29); }
        r10 = peg$FAILED;
        break seq_6;
      }
      r10 = peg$parsePattern(silence);
      if (r10===peg$FAILED) {
        peg$currPos = p12;
        r10 = peg$FAILED;
        break seq_6;
      }
      } // seq_6
      if (r10===peg$FAILED) {
        peg$currPos = p6;
        r10 = peg$FAILED;
        break seq_5;
      }
      // free p12
      } // seq_5
      if (r10!==peg$FAILED) {
        r9.push(r10);
      } else {
        break;
      }
      // free r13
      // free p6
    }
    // rest <- r9
    // free r10
    // free r11
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 93) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c38); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_3;
    }
    r1 = true;
    } // seq_3
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a23(r4, r9);
      break choice_1;
    }
    // free r7,r8,r11
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_7: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 123) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c21); }
      r1 = peg$FAILED;
      break seq_7;
    }
    peg$discard_();
    seq_8: {
    p6 = peg$currPos;
    if (/^["$'-(@-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c39); }
      r8 = peg$FAILED;
      break seq_8;
    }
    r8 = peg$parseObjPat(silence);
    if (r8===peg$FAILED) {
      peg$currPos = p6;
      r8 = peg$FAILED;
      break seq_8;
    }
    } // seq_8
    // first <- r8
    if (r8===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_7;
    }
    // free p6
    r10 = [];
    for (;;) {
      seq_9: {
      p6 = peg$currPos;
      peg$discard_();
      if (input.charCodeAt(peg$currPos) === 44) {
        peg$currPos += 1;
      } else {
        if (!silence) { peg$fail(peg$c32); }
        peg$currPos = p6;
        r13 = peg$FAILED;
        break seq_9;
      }
      peg$discard_();
      seq_10: {
      p12 = peg$currPos;
      if (/^["$'-(@-Z_a-z]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p12;
      } else {
        if (!silence) { peg$fail(peg$c39); }
        r13 = peg$FAILED;
        break seq_10;
      }
      r13 = peg$parseObjPat(silence);
      if (r13===peg$FAILED) {
        peg$currPos = p12;
        r13 = peg$FAILED;
        break seq_10;
      }
      } // seq_10
      if (r13===peg$FAILED) {
        peg$currPos = p6;
        r13 = peg$FAILED;
        break seq_9;
      }
      // free p12
      } // seq_9
      if (r13!==peg$FAILED) {
        r10.push(r13);
      } else {
        break;
      }
      // free r15
      // free p6
    }
    // rest <- r10
    // free r13
    // free r14
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 125) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c22); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_7;
    }
    r1 = true;
    } // seq_7
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a24(r8, r10);
    }
    // free r11,r7,r14
    // free p3
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseCommaRHS(silence) {
    var r1,p2,p3,r4,r5,p6,r7,r8,r9,r10,r11,r14,r15,r16,r18;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,3) === "def") {
      r4 = true;
      peg$currPos += 3;
    } else {
      if (!silence) { peg$fail(peg$c10); }
      r4 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_1;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r5 = true;
    } else {
      r5 = peg$FAILED;
    }
    if (r5 === peg$FAILED) {
      r5 = void 0;
    } else {
      r5 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    seq_2: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r8 = true;
      r8 = void 0;
      peg$currPos = p6;
    } else {
      r8 = peg$FAILED;
      if (!silence) { peg$fail(peg$c11); }
      r7 = peg$FAILED;
      break seq_2;
    }
    r7 = peg$parseFuncName(silence);
    if (r7===peg$FAILED) {
      peg$currPos = p6;
      r7 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // name <- r7
    if (r7===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    r9 = peg$parseFuncParams(silence);
    // params <- r9
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 58) {
      r10 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c12); }
      r10 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    seq_3: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r11 = peg$FAILED;
      break seq_3;
    }
    r11 = peg$parsePipe(silence);
    if (r11===peg$FAILED) {
      peg$currPos = p6;
      r11 = peg$FAILED;
      break seq_3;
    }
    } // seq_3
    // body <- r11
    if (r11===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 59) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c7); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    seq_4: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r15 = true;
      r15 = void 0;
      peg$currPos = p6;
    } else {
      r15 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r14 = peg$FAILED;
      break seq_4;
    }
    r14 = peg$parsePipe(silence);
    if (r14===peg$FAILED) {
      peg$currPos = p6;
      r14 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    // rest <- r14
    if (r14===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a3(r7, r9, r11, r14);
      break choice_1;
    }
    // free r4,r5,r8,r10,r12,r13,r15
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_5: {
    p3 = peg$currPos;
    seq_6: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c13); }
      r15 = peg$FAILED;
      break seq_6;
    }
    r15 = peg$parseAlt(silence);
    if (r15===peg$FAILED) {
      peg$currPos = p3;
      r15 = peg$FAILED;
      break seq_6;
    }
    } // seq_6
    // src <- r15
    if (r15===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_5;
    }
    peg$discard_();
    if (input.substr(peg$currPos,2) === "as") {
      peg$currPos += 2;
    } else {
      if (!silence) { peg$fail(peg$c4); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_5;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r10 = true;
    } else {
      r10 = peg$FAILED;
    }
    if (r10 === peg$FAILED) {
      r10 = void 0;
    } else {
      r10 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_5;
    }
    // free p6
    peg$discard_();
    seq_7: {
    p6 = peg$currPos;
    if (/^[$[{]/.test(input.charAt(peg$currPos))) {
      r5 = true;
      r5 = void 0;
      peg$currPos = p6;
    } else {
      r5 = peg$FAILED;
      if (!silence) { peg$fail(peg$c14); }
      r8 = peg$FAILED;
      break seq_7;
    }
    r8 = peg$parsePatterns(silence);
    if (r8===peg$FAILED) {
      peg$currPos = p6;
      r8 = peg$FAILED;
      break seq_7;
    }
    } // seq_7
    // pat <- r8
    if (r8===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_5;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 124) {
      r4 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c15); }
      r4 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_5;
    }
    peg$discard_();
    seq_8: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r16 = peg$FAILED;
      break seq_8;
    }
    r16 = peg$parsePipe(silence);
    if (r16===peg$FAILED) {
      peg$currPos = p6;
      r16 = peg$FAILED;
      break seq_8;
    }
    } // seq_8
    // body <- r16
    if (r16===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_5;
    }
    // free p6
    r1 = true;
    } // seq_5
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a4(r15, r8, r16);
      break choice_1;
    }
    // free r13,r12,r10,r5,r4,r17
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_9: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,5) === "label") {
      peg$currPos += 5;
    } else {
      if (!silence) { peg$fail(peg$c16); }
      r1 = peg$FAILED;
      break seq_9;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r4 = true;
    } else {
      r4 = peg$FAILED;
    }
    if (r4 === peg$FAILED) {
      r4 = void 0;
    } else {
      r4 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_9;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 36) {
      r5 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c17); }
      r5 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_9;
    }
    seq_10: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c18); }
      r10 = peg$FAILED;
      break seq_10;
    }
    r10 = peg$parseName(silence);
    if (r10===peg$FAILED) {
      peg$currPos = p6;
      r10 = peg$FAILED;
      break seq_10;
    }
    } // seq_10
    // name <- r10
    if (r10===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_9;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 124) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c15); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_9;
    }
    peg$discard_();
    seq_11: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r18 = peg$FAILED;
      break seq_11;
    }
    r18 = peg$parsePipe(silence);
    if (r18===peg$FAILED) {
      peg$currPos = p6;
      r18 = peg$FAILED;
      break seq_11;
    }
    } // seq_11
    // body <- r18
    if (r18===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_9;
    }
    // free p6
    r1 = true;
    } // seq_9
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a5(r10, r18);
      break choice_1;
    }
    // free r17,r4,r5,r12,r13,r19
    // free p3
    // free p2
    seq_12: {
    p2 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p2;
    } else {
      if (!silence) { peg$fail(peg$c13); }
      r1 = peg$FAILED;
      break seq_12;
    }
    r1 = peg$parseAlt(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_12;
    }
    } // seq_12
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseDictPair(silence) {
    var r1,p2,p3,r4,r5,r6,r7,p8,r9,r10,r11,r12;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["'-(@-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r5 = true;
      r5 = void 0;
      peg$currPos = p3;
    } else {
      r5 = peg$FAILED;
      if (!silence) { peg$fail(peg$c40); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parseDictKey(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // key <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 58) {
      r6 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c12); }
      r6 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    seq_3: {
    p8 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r9 = true;
      r9 = void 0;
      peg$currPos = p8;
    } else {
      r9 = peg$FAILED;
      if (!silence) { peg$fail(peg$c41); }
      r7 = peg$FAILED;
      break seq_3;
    }
    r7 = peg$parseDictExpr(silence);
    if (r7===peg$FAILED) {
      peg$currPos = p8;
      r7 = peg$FAILED;
      break seq_3;
    }
    } // seq_3
    // val <- r7
    if (r7===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p8
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a25(r4, r7);
      break choice_1;
    }
    // free r5,r6,r9
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_4: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 36) {
      r9 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c17); }
      r9 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_4;
    }
    seq_5: {
    p8 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r5 = true;
      r5 = void 0;
      peg$currPos = p8;
    } else {
      r5 = peg$FAILED;
      if (!silence) { peg$fail(peg$c18); }
      r6 = peg$FAILED;
      break seq_5;
    }
    r6 = peg$parseName(silence);
    if (r6===peg$FAILED) {
      peg$currPos = p8;
      r6 = peg$FAILED;
      break seq_5;
    }
    } // seq_5
    // name <- r6
    if (r6===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_4;
    }
    // free p8
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 58) {
      r10 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c12); }
      r10 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_4;
    }
    peg$discard_();
    seq_6: {
    p8 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r12 = true;
      r12 = void 0;
      peg$currPos = p8;
    } else {
      r12 = peg$FAILED;
      if (!silence) { peg$fail(peg$c41); }
      r11 = peg$FAILED;
      break seq_6;
    }
    r11 = peg$parseDictExpr(silence);
    if (r11===peg$FAILED) {
      peg$currPos = p8;
      r11 = peg$FAILED;
      break seq_6;
    }
    } // seq_6
    // val <- r11
    if (r11===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_4;
    }
    // free p8
    r1 = true;
    } // seq_4
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a26(r6, r11);
      break choice_1;
    }
    // free r9,r5,r10,r12
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_7: {
    p3 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r10 = true;
      r10 = void 0;
      peg$currPos = p3;
    } else {
      r10 = peg$FAILED;
      if (!silence) { peg$fail(peg$c42); }
      r12 = peg$FAILED;
      break seq_7;
    }
    r12 = peg$parseFieldName(silence);
    if (r12===peg$FAILED) {
      peg$currPos = p3;
      r12 = peg$FAILED;
      break seq_7;
    }
    } // seq_7
    // name <- r12
    // free p3
    r1 = r12;
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a27(r12);
      break choice_1;
    }
    // free r10
    // free p2
    p2 = peg$currPos;
    seq_8: {
    p3 = peg$currPos;
    if (/^["'@]/.test(input.charAt(peg$currPos))) {
      r5 = true;
      r5 = void 0;
      peg$currPos = p3;
    } else {
      r5 = peg$FAILED;
      if (!silence) { peg$fail(peg$c3); }
      r10 = peg$FAILED;
      break seq_8;
    }
    r10 = peg$parseString(silence);
    if (r10===peg$FAILED) {
      peg$currPos = p3;
      r10 = peg$FAILED;
      break seq_8;
    }
    } // seq_8
    // name <- r10
    // free p3
    r1 = r10;
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a28(r10);
      break choice_1;
    }
    // free r5
    // free p2
    p2 = peg$currPos;
    seq_9: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,8) === "$__loc__") {
      r5 = true;
      peg$currPos += 8;
    } else {
      if (!silence) { peg$fail(peg$c43); }
      r5 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_9;
    }
    p8 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r9 = true;
    } else {
      r9 = peg$FAILED;
    }
    if (r9 === peg$FAILED) {
      r9 = void 0;
    } else {
      r9 = peg$FAILED;
      peg$currPos = p8;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_9;
    }
    // free p8
    r1 = true;
    } // seq_9
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a29();
      break choice_1;
    }
    // free r5,r9
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_10: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 36) {
      r9 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c17); }
      r9 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_10;
    }
    seq_11: {
    p8 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p8;
    } else {
      if (!silence) { peg$fail(peg$c18); }
      r5 = peg$FAILED;
      break seq_11;
    }
    r5 = peg$parseName(silence);
    if (r5===peg$FAILED) {
      peg$currPos = p8;
      r5 = peg$FAILED;
      break seq_11;
    }
    } // seq_11
    // name <- r5
    if (r5===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_10;
    }
    // free p8
    r1 = true;
    } // seq_10
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a30(r5);
    }
    // free r9,r13
    // free p3
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseOr(silence) {
    var r1,p2,p3,r4,r6,r7,p8,r10,p11;
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c44); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parseAnd(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // first <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    r6 = [];
    for (;;) {
      seq_3: {
      p8 = peg$currPos;
      peg$discard_();
      if (input.substr(peg$currPos,2) === "or") {
        peg$currPos += 2;
      } else {
        if (!silence) { peg$fail(peg$c45); }
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      p11 = peg$currPos;
      if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
        r10 = true;
      } else {
        r10 = peg$FAILED;
      }
      if (r10 === peg$FAILED) {
        r10 = void 0;
      } else {
        r10 = peg$FAILED;
        peg$currPos = p11;
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p11
      peg$discard_();
      seq_4: {
      p11 = peg$currPos;
      if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p11;
      } else {
        if (!silence) { peg$fail(peg$c44); }
        r7 = peg$FAILED;
        break seq_4;
      }
      r7 = peg$parseAnd(silence);
      if (r7===peg$FAILED) {
        peg$currPos = p11;
        r7 = peg$FAILED;
        break seq_4;
      }
      } // seq_4
      if (r7===peg$FAILED) {
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p11
      } // seq_3
      if (r7!==peg$FAILED) {
        r6.push(r7);
      } else {
        break;
      }
      // free r12
      // free p8
    }
    // rest <- r6
    // free r7
    // free r9,r10
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a31(r4, r6);
    }
    // free r5
    // free p3
    // free p2
    return r1;
  }
  function peg$parseAssignOp(silence) {
    var r1;
    choice_1: {
    r1 = input.substr(peg$currPos,3);
    if (r1 === "//=") {
      peg$currPos += 3;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    r1 = input.substr(peg$currPos,2);
    if (r1 === "|=") {
      peg$currPos += 2;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    r1 = input.substr(peg$currPos,2);
    if (r1 === "+=") {
      peg$currPos += 2;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    r1 = input.substr(peg$currPos,2);
    if (r1 === "-=") {
      peg$currPos += 2;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    r1 = input.substr(peg$currPos,2);
    if (r1 === "*=") {
      peg$currPos += 2;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    r1 = input.substr(peg$currPos,2);
    if (r1 === "/=") {
      peg$currPos += 2;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    r1 = input.substr(peg$currPos,2);
    if (r1 === "%=") {
      peg$currPos += 2;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    if (input.charCodeAt(peg$currPos) === 61) {
      r1 = "=";
      peg$currPos += 1;
    } else {
      r1 = peg$FAILED;
    }
    } // choice_1
    if (r1===peg$FAILED) {
      if (!silence) { peg$fail(peg$c46); }
    }
    return r1;
  }
  function peg$parseObjPat(silence) {
    var r1,p2,p3,r4,r5,p6,r7,r9,r10;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 36) {
      r4 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c17); }
      r4 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_1;
    }
    seq_2: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r7 = true;
      r7 = void 0;
      peg$currPos = p6;
    } else {
      r7 = peg$FAILED;
      if (!silence) { peg$fail(peg$c18); }
      r5 = peg$FAILED;
      break seq_2;
    }
    r5 = peg$parseName(silence);
    if (r5===peg$FAILED) {
      peg$currPos = p6;
      r5 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // name <- r5
    if (r5===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 58) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c12); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    seq_3: {
    p6 = peg$currPos;
    if (/^[$[{]/.test(input.charAt(peg$currPos))) {
      r10 = true;
      r10 = void 0;
      peg$currPos = p6;
    } else {
      r10 = peg$FAILED;
      if (!silence) { peg$fail(peg$c29); }
      r9 = peg$FAILED;
      break seq_3;
    }
    r9 = peg$parsePattern(silence);
    if (r9===peg$FAILED) {
      peg$currPos = p6;
      r9 = peg$FAILED;
      break seq_3;
    }
    } // seq_3
    // pat <- r9
    if (r9===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a32(r5, r9);
      break choice_1;
    }
    // free r4,r7,r8,r10
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_4: {
    p3 = peg$currPos;
    seq_5: {
    if (/^["'-(@-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c47); }
      r10 = peg$FAILED;
      break seq_5;
    }
    r10 = peg$parseObjPatKey(silence);
    if (r10===peg$FAILED) {
      peg$currPos = p3;
      r10 = peg$FAILED;
      break seq_5;
    }
    } // seq_5
    // key <- r10
    if (r10===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_4;
    }
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 58) {
      r7 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c12); }
      r7 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_4;
    }
    peg$discard_();
    seq_6: {
    p6 = peg$currPos;
    if (/^[$[{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c29); }
      r4 = peg$FAILED;
      break seq_6;
    }
    r4 = peg$parsePattern(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p6;
      r4 = peg$FAILED;
      break seq_6;
    }
    } // seq_6
    // pat <- r4
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_4;
    }
    // free p6
    r1 = true;
    } // seq_4
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a33(r10, r4);
      break choice_1;
    }
    // free r8,r7,r11
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_7: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 36) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c17); }
      r1 = peg$FAILED;
      break seq_7;
    }
    seq_8: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c18); }
      r7 = peg$FAILED;
      break seq_8;
    }
    r7 = peg$parseName(silence);
    if (r7===peg$FAILED) {
      peg$currPos = p6;
      r7 = peg$FAILED;
      break seq_8;
    }
    } // seq_8
    // name <- r7
    if (r7===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_7;
    }
    // free p6
    r1 = true;
    } // seq_7
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a34(r7);
    }
    // free r11,r8
    // free p3
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseDictKey(silence) {
    var r1,p2,p4,r7;
    choice_1: {
    seq_1: {
    p2 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c24); }
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    seq_2: {
    p4 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p4;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r1 = peg$FAILED;
      break seq_2;
    }
    r1 = peg$parsePipe(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p4;
      r1 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p4
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 41) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c26); }
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    } // seq_1
    if (r1!==peg$FAILED) {
      break choice_1;
    }
    // free r5
    // free p2
    seq_3: {
    p2 = peg$currPos;
    if (/^["'@]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p2;
    } else {
      if (!silence) { peg$fail(peg$c3); }
      r1 = peg$FAILED;
      break seq_3;
    }
    r1 = peg$parseString(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_3;
    }
    } // seq_3
    if (r1!==peg$FAILED) {
      break choice_1;
    }
    // free p2
    p2 = peg$currPos;
    seq_4: {
    p4 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p4;
    } else {
      if (!silence) { peg$fail(peg$c18); }
      r7 = peg$FAILED;
      break seq_4;
    }
    r7 = peg$parseName(silence);
    if (r7===peg$FAILED) {
      peg$currPos = p4;
      r7 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    // name <- r7
    // free p4
    r1 = r7;
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a35(r7);
    }
    // free r8
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseDictExpr(silence) {
    var r1,p2,p3,r4,r6,p7,p9;
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c13); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parseAlt(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // left <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    seq_3: {
    p7 = peg$currPos;
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 124) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c15); }
      peg$currPos = p7;
      r6 = peg$FAILED;
      break seq_3;
    }
    peg$discard_();
    seq_4: {
    p9 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p9;
    } else {
      if (!silence) { peg$fail(peg$c41); }
      r6 = peg$FAILED;
      break seq_4;
    }
    r6 = peg$parseDictExpr(silence);
    if (r6===peg$FAILED) {
      peg$currPos = p9;
      r6 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    if (r6===peg$FAILED) {
      peg$currPos = p7;
      r6 = peg$FAILED;
      break seq_3;
    }
    // free p9
    } // seq_3
    if (r6===peg$FAILED) {
      r6 = null;
    }
    // free r10
    // free p7
    // right <- r6
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a6(r4, r6);
    }
    // free r5,r8
    // free p3
    // free p2
    return r1;
  }
  function peg$parseFieldName(silence) {
    var p1,r2,r5;
    p1 = peg$currPos;
    seq_1: {
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos++;
    } else {
      r2 = peg$FAILED;
      break seq_1;
    }
    r5 = /[0-9A-Z_a-z]*/y;
    r5.lastIndex = peg$currPos;
    if (r5.exec(input) !== null) {
      peg$currPos = r5.lastIndex;
    } else {
      r5 = peg$FAILED;
    }
    r2 = true;
    } // seq_1
    if (r2!==peg$FAILED) {
      r2 = input.substring(p1, peg$currPos);
    } else {
      r2 = peg$FAILED;
      if (!silence) { peg$fail(peg$c48); }
    }
    // free r4,r5
    // free p3
    // free p1
    return r2;
  }
  function peg$parseAnd(silence) {
    var r1,p2,p3,r4,r6,r7,p8,r10,p11;
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c49); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parseCmp(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // first <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    r6 = [];
    for (;;) {
      seq_3: {
      p8 = peg$currPos;
      peg$discard_();
      if (input.substr(peg$currPos,3) === "and") {
        peg$currPos += 3;
      } else {
        if (!silence) { peg$fail(peg$c50); }
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      p11 = peg$currPos;
      if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
        r10 = true;
      } else {
        r10 = peg$FAILED;
      }
      if (r10 === peg$FAILED) {
        r10 = void 0;
      } else {
        r10 = peg$FAILED;
        peg$currPos = p11;
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p11
      peg$discard_();
      seq_4: {
      p11 = peg$currPos;
      if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p11;
      } else {
        if (!silence) { peg$fail(peg$c49); }
        r7 = peg$FAILED;
        break seq_4;
      }
      r7 = peg$parseCmp(silence);
      if (r7===peg$FAILED) {
        peg$currPos = p11;
        r7 = peg$FAILED;
        break seq_4;
      }
      } // seq_4
      if (r7===peg$FAILED) {
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p11
      } // seq_3
      if (r7!==peg$FAILED) {
        r6.push(r7);
      } else {
        break;
      }
      // free r12
      // free p8
    }
    // rest <- r6
    // free r7
    // free r9,r10
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a36(r4, r6);
    }
    // free r5
    // free p3
    // free p2
    return r1;
  }
  function peg$parseObjPatKey(silence) {
    var r1,p2,p5,r6;
    choice_1: {
    seq_1: {
    p2 = peg$currPos;
    if (/^["'@]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p2;
    } else {
      if (!silence) { peg$fail(peg$c3); }
      r1 = peg$FAILED;
      break seq_1;
    }
    r1 = peg$parseString(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    } // seq_1
    if (r1!==peg$FAILED) {
      break choice_1;
    }
    // free p2
    seq_2: {
    p2 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c24); }
      r1 = peg$FAILED;
      break seq_2;
    }
    peg$discard_();
    seq_3: {
    p5 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r6 = true;
      r6 = void 0;
      peg$currPos = p5;
    } else {
      r6 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r1 = peg$FAILED;
      break seq_3;
    }
    r1 = peg$parsePipe(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p5;
      r1 = peg$FAILED;
      break seq_3;
    }
    } // seq_3
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_2;
    }
    // free p5
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 41) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c26); }
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    if (r1!==peg$FAILED) {
      break choice_1;
    }
    // free r6
    // free p2
    p2 = peg$currPos;
    seq_4: {
    p5 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p5;
    } else {
      if (!silence) { peg$fail(peg$c18); }
      r6 = peg$FAILED;
      break seq_4;
    }
    r6 = peg$parseName(silence);
    if (r6===peg$FAILED) {
      peg$currPos = p5;
      r6 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    // name <- r6
    // free p5
    r1 = r6;
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a35(r6);
    }
    // free r8
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseCmp(silence) {
    var r1,p2,p3,r4,r6,p7,r8,p9,r11;
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c51); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parseAdd(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // left <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    seq_3: {
    p7 = peg$currPos;
    peg$discard_();
    seq_4: {
    p9 = peg$currPos;
    if (/^[!<=>]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p9;
    } else {
      if (!silence) { peg$fail(peg$c52); }
      r8 = peg$FAILED;
      break seq_4;
    }
    r8 = peg$parseCmpOp(silence);
    if (r8===peg$FAILED) {
      peg$currPos = p9;
      r8 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    if (r8===peg$FAILED) {
      peg$currPos = p7;
      r6 = peg$FAILED;
      break seq_3;
    }
    // free p9
    peg$discard_();
    seq_5: {
    p9 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p9;
    } else {
      if (!silence) { peg$fail(peg$c51); }
      r11 = peg$FAILED;
      break seq_5;
    }
    r11 = peg$parseAdd(silence);
    if (r11===peg$FAILED) {
      peg$currPos = p9;
      r11 = peg$FAILED;
      break seq_5;
    }
    } // seq_5
    if (r11===peg$FAILED) {
      peg$currPos = p7;
      r6 = peg$FAILED;
      break seq_3;
    }
    // free p9
    r6 = [r8,r11];
    } // seq_3
    if (r6===peg$FAILED) {
      r6 = null;
    }
    // free r8,r10,r11,r12
    // free p7
    // right <- r6
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a37(r4, r6);
    }
    // free r5
    // free p3
    // free p2
    return r1;
  }
  function peg$parseAdd(silence) {
    var r1,p2,p3,r4,r6,r7,p8,r9,r10,p11;
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c53); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parseMul(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // first <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    r6 = [];
    for (;;) {
      seq_3: {
      p8 = peg$currPos;
      peg$discard_();
      r9 = input.charAt(peg$currPos);
      if (/^[+\-]/.test(r9)) {
        peg$currPos++;
      } else {
        r9 = peg$FAILED;
        if (!silence) { peg$fail(peg$c54); }
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      peg$discard_();
      seq_4: {
      p11 = peg$currPos;
      if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p11;
      } else {
        if (!silence) { peg$fail(peg$c53); }
        r10 = peg$FAILED;
        break seq_4;
      }
      r10 = peg$parseMul(silence);
      if (r10===peg$FAILED) {
        peg$currPos = p11;
        r10 = peg$FAILED;
        break seq_4;
      }
      } // seq_4
      if (r10===peg$FAILED) {
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p11
      r7 = [r9,r10];
      } // seq_3
      if (r7!==peg$FAILED) {
        r6.push(r7);
      } else {
        break;
      }
      // free r9,r10,r12
      // free p8
    }
    // rest <- r6
    // free r7
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a38(r4, r6);
    }
    // free r5
    // free p3
    // free p2
    return r1;
  }
  function peg$parseCmpOp(silence) {
    var r1;
    choice_1: {
    r1 = input.substr(peg$currPos,2);
    if (r1 === "==") {
      peg$currPos += 2;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    r1 = input.substr(peg$currPos,2);
    if (r1 === "!=") {
      peg$currPos += 2;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    r1 = input.substr(peg$currPos,2);
    if (r1 === "<=") {
      peg$currPos += 2;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    r1 = input.substr(peg$currPos,2);
    if (r1 === ">=") {
      peg$currPos += 2;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    if (input.charCodeAt(peg$currPos) === 60) {
      r1 = "<";
      peg$currPos += 1;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    if (input.charCodeAt(peg$currPos) === 62) {
      r1 = ">";
      peg$currPos += 1;
    } else {
      r1 = peg$FAILED;
    }
    } // choice_1
    if (r1===peg$FAILED) {
      if (!silence) { peg$fail(peg$c55); }
    }
    return r1;
  }
  function peg$parseMul(silence) {
    var r1,p2,p3,r4,r6,r7,p8,r9,p10,r12;
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c56); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parsePostfix(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // first <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    r6 = [];
    for (;;) {
      seq_3: {
      p8 = peg$currPos;
      peg$discard_();
      seq_4: {
      p10 = peg$currPos;
      if (/^[%*\/]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p10;
      } else {
        if (!silence) { peg$fail(peg$c57); }
        r9 = peg$FAILED;
        break seq_4;
      }
      r9 = peg$parseMulOp(silence);
      if (r9===peg$FAILED) {
        peg$currPos = p10;
        r9 = peg$FAILED;
        break seq_4;
      }
      } // seq_4
      if (r9===peg$FAILED) {
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p10
      peg$discard_();
      seq_5: {
      p10 = peg$currPos;
      if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p10;
      } else {
        if (!silence) { peg$fail(peg$c56); }
        r12 = peg$FAILED;
        break seq_5;
      }
      r12 = peg$parsePostfix(silence);
      if (r12===peg$FAILED) {
        peg$currPos = p10;
        r12 = peg$FAILED;
        break seq_5;
      }
      } // seq_5
      if (r12===peg$FAILED) {
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p10
      r7 = [r9,r12];
      } // seq_3
      if (r7!==peg$FAILED) {
        r6.push(r7);
      } else {
        break;
      }
      // free r9,r11,r12,r13
      // free p8
    }
    // rest <- r6
    // free r7
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a38(r4, r6);
    }
    // free r5
    // free p3
    // free p2
    return r1;
  }
  function peg$parsePostfix(silence) {
    var r1,p2,p3,r4,r6,r7,p8,p9;
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c58); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parseTerm(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // expr <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    r6 = [];
    for (;;) {
      seq_3: {
      p8 = peg$currPos;
      peg$discard_();
      seq_4: {
      p9 = peg$currPos;
      if (/^[\t\n\r #.?[]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p9;
      } else {
        if (!silence) { peg$fail(peg$c59); }
        r7 = peg$FAILED;
        break seq_4;
      }
      r7 = peg$parseSuffix(silence);
      if (r7===peg$FAILED) {
        peg$currPos = p9;
        r7 = peg$FAILED;
        break seq_4;
      }
      } // seq_4
      if (r7===peg$FAILED) {
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p9
      } // seq_3
      if (r7!==peg$FAILED) {
        r6.push(r7);
      } else {
        break;
      }
      // free r10
      // free p8
    }
    // suffixes <- r6
    // free r7
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a39(r4, r6);
    }
    // free r5
    // free p3
    // free p2
    return r1;
  }
  function peg$parseMulOp(silence) {
    var r1,p2,r3,p4;
    choice_1: {
    if (input.charCodeAt(peg$currPos) === 42) {
      r1 = "*";
      peg$currPos += 1;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    if (input.charCodeAt(peg$currPos) === 37) {
      r1 = "%";
      peg$currPos += 1;
      break choice_1;
    } else {
      r1 = peg$FAILED;
    }
    seq_1: {
    p2 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 47) {
      r1 = "/";
      peg$currPos += 1;
    } else {
      r1 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_1;
    }
    p4 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 47) {
      r3 = true;
    } else {
      r3 = peg$FAILED;
    }
    if (r3 === peg$FAILED) {
      r3 = void 0;
    } else {
      r3 = peg$FAILED;
      peg$currPos = p4;
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p4
    } // seq_1
    // free p2
    } // choice_1
    if (r1===peg$FAILED) {
      if (!silence) { peg$fail(peg$c60); }
    }
    return r1;
  }
  function peg$parseTerm(silence) {
    var r1,p2,p3,r4,r5,p6,r7,r8,r9,r10,r13,r15,r16,r17,r18,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r32,r34,r35,r36,r38,r39,r41,r42,r43;
    choice_1: {
    p2 = peg$currPos;
    if (input.substr(peg$currPos,2) === "..") {
      r1 = true;
      peg$currPos += 2;
      peg$savedPos = p2;
      r1 = peg$a40();
      break choice_1;
    } else {
      if (!silence) { peg$fail(peg$c61); }
      r1 = peg$FAILED;
    }
    // free p2
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      r4 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c62); }
      r4 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_1;
    }
    seq_2: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r7 = true;
      r7 = void 0;
      peg$currPos = p6;
    } else {
      r7 = peg$FAILED;
      if (!silence) { peg$fail(peg$c42); }
      r5 = peg$FAILED;
      break seq_2;
    }
    r5 = peg$parseFieldName(silence);
    if (r5===peg$FAILED) {
      peg$currPos = p6;
      r5 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // name <- r5
    if (r5===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    r8 = peg$parseOptQ(silence);
    // opt <- r8
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a41(r5, r8);
      break choice_1;
    }
    // free r4,r7
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_3: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      r7 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c62); }
      r7 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_3;
    }
    peg$discard_();
    seq_4: {
    p6 = peg$currPos;
    if (/^["'@]/.test(input.charAt(peg$currPos))) {
      r9 = true;
      r9 = void 0;
      peg$currPos = p6;
    } else {
      r9 = peg$FAILED;
      if (!silence) { peg$fail(peg$c3); }
      r4 = peg$FAILED;
      break seq_4;
    }
    r4 = peg$parseString(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p6;
      r4 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    // name <- r4
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_3;
    }
    // free p6
    r10 = peg$parseOptQ(silence);
    // opt <- r10
    r1 = true;
    } // seq_3
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a42(r4, r10);
      break choice_1;
    }
    // free r7,r9
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_5: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      r9 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c62); }
      r9 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_5;
    }
    p6 = peg$currPos;
    if (/^[0123456789]/.test(input.charAt(peg$currPos))) {
      r7 = true;
    } else {
      r7 = peg$FAILED;
    }
    if (r7 === peg$FAILED) {
      r7 = void 0;
    } else {
      r7 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_5;
    }
    // free p6
    r1 = true;
    } // seq_5
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a43();
      break choice_1;
    }
    // free r9,r7
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_6: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 45) {
      r7 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c63); }
      r7 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_6;
    }
    peg$discard_();
    seq_7: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c56); }
      r9 = peg$FAILED;
      break seq_7;
    }
    r9 = peg$parsePostfix(silence);
    if (r9===peg$FAILED) {
      peg$currPos = p6;
      r9 = peg$FAILED;
      break seq_7;
    }
    } // seq_7
    // t <- r9
    if (r9===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_6;
    }
    // free p6
    r1 = true;
    } // seq_6
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a44(r9);
      break choice_1;
    }
    // free r7,r11
    // free p3
    // free p2
    seq_8: {
    p2 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c24); }
      r1 = peg$FAILED;
      break seq_8;
    }
    peg$discard_();
    seq_9: {
    p3 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r7 = true;
      r7 = void 0;
      peg$currPos = p3;
    } else {
      r7 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r1 = peg$FAILED;
      break seq_9;
    }
    r1 = peg$parsePipe(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_9;
    }
    } // seq_9
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_8;
    }
    // free p3
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 41) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c26); }
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_8;
    }
    } // seq_8
    if (r1!==peg$FAILED) {
      break choice_1;
    }
    // free r7
    // free p2
    p2 = peg$currPos;
    seq_10: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 91) {
      r7 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c37); }
      r7 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_10;
    }
    peg$discard_();
    seq_11: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r13 = peg$FAILED;
      break seq_11;
    }
    r13 = peg$parsePipe(silence);
    if (r13===peg$FAILED) {
      peg$currPos = p6;
      r13 = peg$FAILED;
      break seq_11;
    }
    } // seq_11
    // expr <- r13
    if (r13===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_10;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 93) {
      r15 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c38); }
      r15 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_10;
    }
    r1 = true;
    } // seq_10
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a45(r13);
      break choice_1;
    }
    // free r7,r14,r15
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_12: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 91) {
      r15 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c37); }
      r15 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_12;
    }
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 93) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c38); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_12;
    }
    r1 = true;
    } // seq_12
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a46();
      break choice_1;
    }
    // free r15,r14
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_13: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 123) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c21); }
      r1 = peg$FAILED;
      break seq_13;
    }
    peg$discard_();
    r15 = peg$parseDictPairs(silence);
    // pairs <- r15
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 125) {
      r7 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c22); }
      r7 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_13;
    }
    r1 = true;
    } // seq_13
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a47(r15);
      break choice_1;
    }
    // free r14,r7
    // free p3
    // free p2
    seq_14: {
    p2 = peg$currPos;
    if (/^["'@]/.test(input.charAt(peg$currPos))) {
      r7 = true;
      r7 = void 0;
      peg$currPos = p2;
    } else {
      r7 = peg$FAILED;
      if (!silence) { peg$fail(peg$c3); }
      r1 = peg$FAILED;
      break seq_14;
    }
    r1 = peg$parseString(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_14;
    }
    } // seq_14
    if (r1!==peg$FAILED) {
      break choice_1;
    }
    // free p2
    seq_15: {
    p2 = peg$currPos;
    if (/^[.0123456789]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p2;
    } else {
      if (!silence) { peg$fail(peg$c64); }
      r1 = peg$FAILED;
      break seq_15;
    }
    r1 = peg$parseNumber(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_15;
    }
    } // seq_15
    if (r1!==peg$FAILED) {
      break choice_1;
    }
    // free p2
    p2 = peg$currPos;
    seq_16: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,4) === "null") {
      r16 = true;
      peg$currPos += 4;
    } else {
      if (!silence) { peg$fail(peg$c65); }
      r16 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_16;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r17 = true;
    } else {
      r17 = peg$FAILED;
    }
    if (r17 === peg$FAILED) {
      r17 = void 0;
    } else {
      r17 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_16;
    }
    // free p6
    r1 = true;
    } // seq_16
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a48();
      break choice_1;
    }
    // free r16,r17
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_17: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,4) === "true") {
      r17 = true;
      peg$currPos += 4;
    } else {
      if (!silence) { peg$fail(peg$c66); }
      r17 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_17;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r16 = true;
    } else {
      r16 = peg$FAILED;
    }
    if (r16 === peg$FAILED) {
      r16 = void 0;
    } else {
      r16 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_17;
    }
    // free p6
    r1 = true;
    } // seq_17
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a49();
      break choice_1;
    }
    // free r17,r16
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_18: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,5) === "false") {
      r16 = true;
      peg$currPos += 5;
    } else {
      if (!silence) { peg$fail(peg$c67); }
      r16 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_18;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r17 = true;
    } else {
      r17 = peg$FAILED;
    }
    if (r17 === peg$FAILED) {
      r17 = void 0;
    } else {
      r17 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_18;
    }
    // free p6
    r1 = true;
    } // seq_18
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a50();
      break choice_1;
    }
    // free r16,r17
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_19: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,8) === "$__loc__") {
      r17 = true;
      peg$currPos += 8;
    } else {
      if (!silence) { peg$fail(peg$c43); }
      r17 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_19;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r16 = true;
    } else {
      r16 = peg$FAILED;
    }
    if (r16 === peg$FAILED) {
      r16 = void 0;
    } else {
      r16 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_19;
    }
    // free p6
    r1 = true;
    } // seq_19
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a51();
      break choice_1;
    }
    // free r17,r16
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_20: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 64) {
      r16 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c68); }
      r16 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_20;
    }
    seq_21: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r18 = true;
      r18 = void 0;
      peg$currPos = p6;
    } else {
      r18 = peg$FAILED;
      if (!silence) { peg$fail(peg$c18); }
      r17 = peg$FAILED;
      break seq_21;
    }
    r17 = peg$parseName(silence);
    if (r17===peg$FAILED) {
      peg$currPos = p6;
      r17 = peg$FAILED;
      break seq_21;
    }
    } // seq_21
    // fmt <- r17
    if (r17===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_20;
    }
    // free p6
    r1 = true;
    } // seq_20
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a52(r17);
      break choice_1;
    }
    // free r16,r18
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_22: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 36) {
      r18 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c17); }
      r18 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_22;
    }
    seq_23: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c18); }
      r16 = peg$FAILED;
      break seq_23;
    }
    r16 = peg$parseName(silence);
    if (r16===peg$FAILED) {
      peg$currPos = p6;
      r16 = peg$FAILED;
      break seq_23;
    }
    } // seq_23
    // name <- r16
    if (r16===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_22;
    }
    // free p6
    r1 = true;
    } // seq_22
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a53(r16);
      break choice_1;
    }
    // free r18,r19
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_24: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,2) === "if") {
      peg$currPos += 2;
    } else {
      if (!silence) { peg$fail(peg$c69); }
      r1 = peg$FAILED;
      break seq_24;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r18 = true;
    } else {
      r18 = peg$FAILED;
    }
    if (r18 === peg$FAILED) {
      r18 = void 0;
    } else {
      r18 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_24;
    }
    // free p6
    peg$discard_();
    seq_25: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r21 = true;
      r21 = void 0;
      peg$currPos = p6;
    } else {
      r21 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r20 = peg$FAILED;
      break seq_25;
    }
    r20 = peg$parsePipe(silence);
    if (r20===peg$FAILED) {
      peg$currPos = p6;
      r20 = peg$FAILED;
      break seq_25;
    }
    } // seq_25
    // cond <- r20
    if (r20===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_24;
    }
    // free p6
    peg$discard_();
    if (input.substr(peg$currPos,4) === "then") {
      r22 = true;
      peg$currPos += 4;
    } else {
      if (!silence) { peg$fail(peg$c70); }
      r22 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_24;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r23 = true;
    } else {
      r23 = peg$FAILED;
    }
    if (r23 === peg$FAILED) {
      r23 = void 0;
    } else {
      r23 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_24;
    }
    // free p6
    peg$discard_();
    seq_26: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r25 = true;
      r25 = void 0;
      peg$currPos = p6;
    } else {
      r25 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r24 = peg$FAILED;
      break seq_26;
    }
    r24 = peg$parsePipe(silence);
    if (r24===peg$FAILED) {
      peg$currPos = p6;
      r24 = peg$FAILED;
      break seq_26;
    }
    } // seq_26
    // then <- r24
    if (r24===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_24;
    }
    // free p6
    peg$discard_();
    seq_27: {
    p6 = peg$currPos;
    if (/^[e]/.test(input.charAt(peg$currPos))) {
      r27 = true;
      r27 = void 0;
      peg$currPos = p6;
    } else {
      r27 = peg$FAILED;
      if (!silence) { peg$fail(peg$c71); }
      r26 = peg$FAILED;
      break seq_27;
    }
    r26 = peg$parseElseBody(silence);
    if (r26===peg$FAILED) {
      peg$currPos = p6;
      r26 = peg$FAILED;
      break seq_27;
    }
    } // seq_27
    // elseBody <- r26
    if (r26===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_24;
    }
    // free p6
    r1 = true;
    } // seq_24
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a54(r20, r24, r26);
      break choice_1;
    }
    // free r19,r18,r21,r22,r23,r25,r27
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_28: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,3) === "try") {
      r27 = true;
      peg$currPos += 3;
    } else {
      if (!silence) { peg$fail(peg$c72); }
      r27 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_28;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r25 = true;
    } else {
      r25 = peg$FAILED;
    }
    if (r25 === peg$FAILED) {
      r25 = void 0;
    } else {
      r25 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_28;
    }
    // free p6
    peg$discard_();
    seq_29: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r22 = true;
      r22 = void 0;
      peg$currPos = p6;
    } else {
      r22 = peg$FAILED;
      if (!silence) { peg$fail(peg$c56); }
      r23 = peg$FAILED;
      break seq_29;
    }
    r23 = peg$parsePostfix(silence);
    if (r23===peg$FAILED) {
      peg$currPos = p6;
      r23 = peg$FAILED;
      break seq_29;
    }
    } // seq_29
    // body <- r23
    if (r23===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_28;
    }
    // free p6
    peg$discard_();
    seq_30: {
    p6 = peg$currPos;
    if (/^[c]/.test(input.charAt(peg$currPos))) {
      r18 = true;
      r18 = void 0;
      peg$currPos = p6;
    } else {
      r18 = peg$FAILED;
      if (!silence) { peg$fail(peg$c73); }
      r21 = peg$FAILED;
      break seq_30;
    }
    r21 = peg$parseTryCatch(silence);
    if (r21===peg$FAILED) {
      peg$currPos = p6;
      r21 = peg$FAILED;
      break seq_30;
    }
    } // seq_30
    if (r21===peg$FAILED) {
      r21 = null;
    }
    // free p6
    // catch_ <- r21
    r1 = true;
    } // seq_28
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a55(r23, r21);
      break choice_1;
    }
    // free r27,r25,r22,r18
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_31: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,6) === "reduce") {
      r18 = true;
      peg$currPos += 6;
    } else {
      if (!silence) { peg$fail(peg$c74); }
      r18 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_31;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r22 = true;
    } else {
      r22 = peg$FAILED;
    }
    if (r22 === peg$FAILED) {
      r22 = void 0;
    } else {
      r22 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_31;
    }
    // free p6
    peg$discard_();
    seq_32: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r27 = true;
      r27 = void 0;
      peg$currPos = p6;
    } else {
      r27 = peg$FAILED;
      if (!silence) { peg$fail(peg$c13); }
      r25 = peg$FAILED;
      break seq_32;
    }
    r25 = peg$parseAlt(silence);
    if (r25===peg$FAILED) {
      peg$currPos = p6;
      r25 = peg$FAILED;
      break seq_32;
    }
    } // seq_32
    // src <- r25
    if (r25===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_31;
    }
    // free p6
    peg$discard_();
    if (input.substr(peg$currPos,2) === "as") {
      peg$currPos += 2;
    } else {
      if (!silence) { peg$fail(peg$c4); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_31;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r28 = true;
    } else {
      r28 = peg$FAILED;
    }
    if (r28 === peg$FAILED) {
      r28 = void 0;
    } else {
      r28 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_31;
    }
    // free p6
    peg$discard_();
    seq_33: {
    p6 = peg$currPos;
    if (/^[$[{]/.test(input.charAt(peg$currPos))) {
      r30 = true;
      r30 = void 0;
      peg$currPos = p6;
    } else {
      r30 = peg$FAILED;
      if (!silence) { peg$fail(peg$c14); }
      r29 = peg$FAILED;
      break seq_33;
    }
    r29 = peg$parsePatterns(silence);
    if (r29===peg$FAILED) {
      peg$currPos = p6;
      r29 = peg$FAILED;
      break seq_33;
    }
    } // seq_33
    // pat <- r29
    if (r29===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_31;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 40) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c24); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_31;
    }
    peg$discard_();
    seq_34: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r32 = peg$FAILED;
      break seq_34;
    }
    r32 = peg$parsePipe(silence);
    if (r32===peg$FAILED) {
      peg$currPos = p6;
      r32 = peg$FAILED;
      break seq_34;
    }
    } // seq_34
    // init <- r32
    if (r32===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_31;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 59) {
      r34 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c7); }
      r34 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_31;
    }
    peg$discard_();
    seq_35: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r36 = true;
      r36 = void 0;
      peg$currPos = p6;
    } else {
      r36 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r35 = peg$FAILED;
      break seq_35;
    }
    r35 = peg$parsePipe(silence);
    if (r35===peg$FAILED) {
      peg$currPos = p6;
      r35 = peg$FAILED;
      break seq_35;
    }
    } // seq_35
    // update <- r35
    if (r35===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_31;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 41) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c26); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_31;
    }
    r1 = true;
    } // seq_31
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a56(r25, r29, r32, r35);
      break choice_1;
    }
    // free r18,r22,r27,r19,r28,r30,r31,r33,r34,r36,r37
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_36: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,7) === "foreach") {
      peg$currPos += 7;
    } else {
      if (!silence) { peg$fail(peg$c75); }
      r1 = peg$FAILED;
      break seq_36;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r36 = true;
    } else {
      r36 = peg$FAILED;
    }
    if (r36 === peg$FAILED) {
      r36 = void 0;
    } else {
      r36 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_36;
    }
    // free p6
    peg$discard_();
    seq_37: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c13); }
      r34 = peg$FAILED;
      break seq_37;
    }
    r34 = peg$parseAlt(silence);
    if (r34===peg$FAILED) {
      peg$currPos = p6;
      r34 = peg$FAILED;
      break seq_37;
    }
    } // seq_37
    // src <- r34
    if (r34===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_36;
    }
    // free p6
    peg$discard_();
    if (input.substr(peg$currPos,2) === "as") {
      peg$currPos += 2;
    } else {
      if (!silence) { peg$fail(peg$c4); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_36;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r30 = true;
    } else {
      r30 = peg$FAILED;
    }
    if (r30 === peg$FAILED) {
      r30 = void 0;
    } else {
      r30 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_36;
    }
    // free p6
    peg$discard_();
    seq_38: {
    p6 = peg$currPos;
    if (/^[$[{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c14); }
      r28 = peg$FAILED;
      break seq_38;
    }
    r28 = peg$parsePatterns(silence);
    if (r28===peg$FAILED) {
      peg$currPos = p6;
      r28 = peg$FAILED;
      break seq_38;
    }
    } // seq_38
    // pat <- r28
    if (r28===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_36;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 40) {
      r27 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c24); }
      r27 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_36;
    }
    peg$discard_();
    seq_39: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r18 = true;
      r18 = void 0;
      peg$currPos = p6;
    } else {
      r18 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r22 = peg$FAILED;
      break seq_39;
    }
    r22 = peg$parsePipe(silence);
    if (r22===peg$FAILED) {
      peg$currPos = p6;
      r22 = peg$FAILED;
      break seq_39;
    }
    } // seq_39
    // init <- r22
    if (r22===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_36;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 59) {
      r38 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c7); }
      r38 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_36;
    }
    peg$discard_();
    seq_40: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r39 = peg$FAILED;
      break seq_40;
    }
    r39 = peg$parsePipe(silence);
    if (r39===peg$FAILED) {
      peg$currPos = p6;
      r39 = peg$FAILED;
      break seq_40;
    }
    } // seq_40
    // update <- r39
    if (r39===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_36;
    }
    // free p6
    seq_41: {
    p6 = peg$currPos;
    if (/^[\t\n\r #;]/.test(input.charAt(peg$currPos))) {
      r42 = true;
      r42 = void 0;
      peg$currPos = p6;
    } else {
      r42 = peg$FAILED;
      if (!silence) { peg$fail(peg$c76); }
      r41 = peg$FAILED;
      break seq_41;
    }
    r41 = peg$parseForeachExtract(silence);
    if (r41===peg$FAILED) {
      peg$currPos = p6;
      r41 = peg$FAILED;
      break seq_41;
    }
    } // seq_41
    if (r41===peg$FAILED) {
      r41 = null;
    }
    // free p6
    // extract <- r41
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 41) {
      r43 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c26); }
      r43 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_36;
    }
    r1 = true;
    } // seq_36
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a57(r34, r28, r22, r39, r41);
      break choice_1;
    }
    // free r37,r36,r33,r31,r30,r19,r27,r18,r38,r40,r42,r43
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_42: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,5) === "break") {
      r43 = true;
      peg$currPos += 5;
    } else {
      if (!silence) { peg$fail(peg$c77); }
      r43 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_42;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r42 = true;
    } else {
      r42 = peg$FAILED;
    }
    if (r42 === peg$FAILED) {
      r42 = void 0;
    } else {
      r42 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_42;
    }
    // free p6
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 36) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c17); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_42;
    }
    seq_43: {
    p6 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r18 = true;
      r18 = void 0;
      peg$currPos = p6;
    } else {
      r18 = peg$FAILED;
      if (!silence) { peg$fail(peg$c18); }
      r38 = peg$FAILED;
      break seq_43;
    }
    r38 = peg$parseName(silence);
    if (r38===peg$FAILED) {
      peg$currPos = p6;
      r38 = peg$FAILED;
      break seq_43;
    }
    } // seq_43
    // name <- r38
    if (r38===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_42;
    }
    // free p6
    r1 = true;
    } // seq_42
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a58(r38);
      break choice_1;
    }
    // free r43,r42,r40,r18
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_44: {
    p3 = peg$currPos;
    seq_45: {
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c11); }
      r18 = peg$FAILED;
      break seq_45;
    }
    r18 = peg$parseFuncName(silence);
    if (r18===peg$FAILED) {
      peg$currPos = p3;
      r18 = peg$FAILED;
      break seq_45;
    }
    } // seq_45
    // name <- r18
    if (r18===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_44;
    }
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 40) {
      r42 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c24); }
      r42 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_44;
    }
    peg$discard_();
    r43 = peg$parseFuncArgs(silence);
    // args <- r43
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 41) {
      r27 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c26); }
      r27 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_44;
    }
    r1 = true;
    } // seq_44
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a59(r18, r43);
      break choice_1;
    }
    // free r40,r42,r27
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_46: {
    p3 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r42 = true;
      r42 = void 0;
      peg$currPos = p3;
    } else {
      r42 = peg$FAILED;
      if (!silence) { peg$fail(peg$c11); }
      r27 = peg$FAILED;
      break seq_46;
    }
    r27 = peg$parseFuncName(silence);
    if (r27===peg$FAILED) {
      peg$currPos = p3;
      r27 = peg$FAILED;
      break seq_46;
    }
    } // seq_46
    // name <- r27
    // free p3
    r1 = r27;
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a60(r27);
    }
    // free r42
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseSuffix(silence) {
    var r1,p2,p3,r4,r5,r6,r7,r9,r10,r11,p12,r13,r14,r16;
    choice_1: {
    p2 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 63) {
      r1 = true;
      peg$currPos += 1;
      peg$savedPos = p2;
      r1 = peg$a61();
      break choice_1;
    } else {
      if (!silence) { peg$fail(peg$c78); }
      r1 = peg$FAILED;
    }
    // free p2
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      r4 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c62); }
      r4 = peg$FAILED;
      r4 = null;
    }
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 91) {
      r5 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c37); }
      r5 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 93) {
      r6 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c38); }
      r6 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    r7 = peg$parseOptQ(silence);
    // opt <- r7
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a62(r7);
      break choice_1;
    }
    // free r4,r5,r6
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_2: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      r6 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c62); }
      r6 = peg$FAILED;
      r6 = null;
    }
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 91) {
      r5 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c37); }
      r5 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_2;
    }
    peg$discard_();
    r4 = peg$parseSliceBound(silence);
    // from <- r4
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 58) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c12); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_2;
    }
    peg$discard_();
    r9 = peg$parseSliceBound(silence);
    // to <- r9
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 93) {
      r10 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c38); }
      r10 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_2;
    }
    r11 = peg$parseOptQ(silence);
    // opt <- r11
    r1 = true;
    } // seq_2
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a63(r4, r9, r11);
      break choice_1;
    }
    // free r6,r5,r8,r10
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_3: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      r10 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c62); }
      r10 = peg$FAILED;
      r10 = null;
    }
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 91) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c37); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_3;
    }
    peg$discard_();
    seq_4: {
    p12 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r6 = true;
      r6 = void 0;
      peg$currPos = p12;
    } else {
      r6 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r5 = peg$FAILED;
      break seq_4;
    }
    r5 = peg$parsePipe(silence);
    if (r5===peg$FAILED) {
      peg$currPos = p12;
      r5 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    // key <- r5
    if (r5===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_3;
    }
    // free p12
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 93) {
      r13 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c38); }
      r13 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_3;
    }
    r14 = peg$parseOptQ(silence);
    // opt <- r14
    r1 = true;
    } // seq_3
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a64(r5, r14);
      break choice_1;
    }
    // free r10,r8,r6,r13
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_5: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      r13 = true;
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c62); }
      r13 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_5;
    }
    seq_6: {
    p12 = peg$currPos;
    if (/^[A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p12;
    } else {
      if (!silence) { peg$fail(peg$c42); }
      r6 = peg$FAILED;
      break seq_6;
    }
    r6 = peg$parseFieldName(silence);
    if (r6===peg$FAILED) {
      peg$currPos = p12;
      r6 = peg$FAILED;
      break seq_6;
    }
    } // seq_6
    // name <- r6
    if (r6===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_5;
    }
    // free p12
    r10 = peg$parseOptQ(silence);
    // opt <- r10
    r1 = true;
    } // seq_5
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a65(r6, r10);
      break choice_1;
    }
    // free r13,r8
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_7: {
    p3 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c62); }
      r1 = peg$FAILED;
      break seq_7;
    }
    peg$discard_();
    seq_8: {
    p12 = peg$currPos;
    if (/^["'@]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p12;
    } else {
      if (!silence) { peg$fail(peg$c3); }
      r13 = peg$FAILED;
      break seq_8;
    }
    r13 = peg$parseString(silence);
    if (r13===peg$FAILED) {
      peg$currPos = p12;
      r13 = peg$FAILED;
      break seq_8;
    }
    } // seq_8
    // name <- r13
    if (r13===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_7;
    }
    // free p12
    r16 = peg$parseOptQ(silence);
    // opt <- r16
    r1 = true;
    } // seq_7
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a66(r13, r16);
    }
    // free r8,r15
    // free p3
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseOptQ(silence) {
    var r1,p2,p3;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 63) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c78); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a67();
      break choice_1;
    }
    // free r4
    // free p3
    // free p2
    p2 = peg$currPos;
    r1 = true;
    peg$savedPos = p2;
    r1 = peg$a68();
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseNumber(silence) {
    var r1,p2,p3,r4,p5,r6,r7,r8,p10,r11,r12;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    p5 = peg$currPos;
    r4 = /[0123456789]+/y;
    r4.lastIndex = peg$currPos;
    // n <- r4
    if (r4.exec(input) !== null) {
      peg$currPos = r4.lastIndex;
      r4 = input.substring(p5, peg$currPos);
    } else {
      r4 = peg$FAILED;
      r4 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p5
    p5 = peg$currPos;
    if (/^[Ee]/.test(input.charAt(peg$currPos))) {
      r6 = true;
    } else {
      r6 = peg$FAILED;
    }
    if (r6 === peg$FAILED) {
      r6 = void 0;
    } else {
      r6 = peg$FAILED;
      peg$currPos = p5;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p5
    p5 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      r7 = true;
    } else {
      r7 = peg$FAILED;
    }
    if (r7 === peg$FAILED) {
      r7 = void 0;
    } else {
      r7 = peg$FAILED;
      peg$currPos = p5;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p5
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a69(r4);
      break choice_1;
    }
    // free r6,r7
    // free p3
    // free p2
    p2 = peg$currPos;
    p3 = peg$currPos;
    seq_2: {
    p5 = peg$currPos;
    choice_2: {
    seq_3: {
    r8 = /[0123456789]+/y;
    r8.lastIndex = peg$currPos;
    if (r8.exec(input) !== null) {
      peg$currPos = r8.lastIndex;
    } else {
      r8 = peg$FAILED;
      r6 = peg$FAILED;
      break seq_3;
    }
    seq_4: {
    p10 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      r11 = true;
      peg$currPos += 1;
    } else {
      r11 = peg$FAILED;
      break seq_4;
    }
    r12 = /[0123456789]*/y;
    r12.lastIndex = peg$currPos;
    if (r12.exec(input) !== null) {
      peg$currPos = r12.lastIndex;
    } else {
      r12 = peg$FAILED;
    }
    } // seq_4
    // free r11,r12
    // free p10
    r6 = true;
    } // seq_3
    if (r6!==peg$FAILED) {
      break choice_2;
    }
    // free r8,r9
    seq_5: {
    if (input.charCodeAt(peg$currPos) === 46) {
      peg$currPos += 1;
    } else {
      r6 = peg$FAILED;
      break seq_5;
    }
    r8 = /[0123456789]+/y;
    r8.lastIndex = peg$currPos;
    if (r8.exec(input) !== null) {
      peg$currPos = r8.lastIndex;
    } else {
      r8 = peg$FAILED;
      peg$currPos = p5;
      r6 = peg$FAILED;
      break seq_5;
    }
    r6 = true;
    } // seq_5
    // free r9,r8
    } // choice_2
    if (r6===peg$FAILED) {
      r7 = peg$FAILED;
      break seq_2;
    }
    seq_6: {
    p10 = peg$currPos;
    if (/^[Ee]/.test(input.charAt(peg$currPos))) {
      peg$currPos++;
    } else {
      r8 = peg$FAILED;
      break seq_6;
    }
    if (/^[+\-]/.test(input.charAt(peg$currPos))) {
      r12 = true;
      peg$currPos++;
    } else {
      r12 = peg$FAILED;
      r12 = null;
    }
    r11 = /[0123456789]+/y;
    r11.lastIndex = peg$currPos;
    if (r11.exec(input) !== null) {
      peg$currPos = r11.lastIndex;
    } else {
      r11 = peg$FAILED;
      peg$currPos = p10;
      r8 = peg$FAILED;
      break seq_6;
    }
    r8 = true;
    } // seq_6
    if (r8===peg$FAILED) {
      r8 = null;
    }
    // free r9,r12,r11
    // free p10
    r7 = true;
    } // seq_2
    // n <- r7
    if (r7!==peg$FAILED) {
      r7 = input.substring(p3, peg$currPos);
    } else {
      r7 = peg$FAILED;
    }
    // free r6,r8
    // free p5
    // free p3
    r1 = r7;
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a70(r7);
    }
    // free p2
    } // choice_1
    if (r1===peg$FAILED) {
      if (!silence) { peg$fail(peg$c79); }
    }
    return r1;
  }
  function peg$parseElseBody(silence) {
    var r1,p2,p3,r5,p6,r7,r8,r10,r11,r12,r13;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,4) === "elif") {
      peg$currPos += 4;
    } else {
      if (!silence) { peg$fail(peg$c80); }
      r1 = peg$FAILED;
      break seq_1;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r5 = true;
    } else {
      r5 = peg$FAILED;
    }
    if (r5 === peg$FAILED) {
      r5 = void 0;
    } else {
      r5 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    seq_2: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r8 = true;
      r8 = void 0;
      peg$currPos = p6;
    } else {
      r8 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r7 = peg$FAILED;
      break seq_2;
    }
    r7 = peg$parsePipe(silence);
    if (r7===peg$FAILED) {
      peg$currPos = p6;
      r7 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // cond <- r7
    if (r7===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    if (input.substr(peg$currPos,4) === "then") {
      peg$currPos += 4;
    } else {
      if (!silence) { peg$fail(peg$c70); }
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r10 = true;
    } else {
      r10 = peg$FAILED;
    }
    if (r10 === peg$FAILED) {
      r10 = void 0;
    } else {
      r10 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    seq_3: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      r12 = true;
      r12 = void 0;
      peg$currPos = p6;
    } else {
      r12 = peg$FAILED;
      if (!silence) { peg$fail(peg$c1); }
      r11 = peg$FAILED;
      break seq_3;
    }
    r11 = peg$parsePipe(silence);
    if (r11===peg$FAILED) {
      peg$currPos = p6;
      r11 = peg$FAILED;
      break seq_3;
    }
    } // seq_3
    // then <- r11
    if (r11===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    peg$discard_();
    seq_4: {
    p6 = peg$currPos;
    if (/^[e]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c71); }
      r13 = peg$FAILED;
      break seq_4;
    }
    r13 = peg$parseElseBody(silence);
    if (r13===peg$FAILED) {
      peg$currPos = p6;
      r13 = peg$FAILED;
      break seq_4;
    }
    } // seq_4
    // rest <- r13
    if (r13===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p6
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a71(r7, r11, r13);
      break choice_1;
    }
    // free r4,r5,r8,r9,r10,r12,r14
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_5: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,4) === "else") {
      peg$currPos += 4;
    } else {
      if (!silence) { peg$fail(peg$c81); }
      r1 = peg$FAILED;
      break seq_5;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r12 = true;
    } else {
      r12 = peg$FAILED;
    }
    if (r12 === peg$FAILED) {
      r12 = void 0;
    } else {
      r12 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_5;
    }
    // free p6
    peg$discard_();
    seq_6: {
    p6 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p6;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r10 = peg$FAILED;
      break seq_6;
    }
    r10 = peg$parsePipe(silence);
    if (r10===peg$FAILED) {
      peg$currPos = p6;
      r10 = peg$FAILED;
      break seq_6;
    }
    } // seq_6
    // body <- r10
    if (r10===peg$FAILED) {
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_5;
    }
    // free p6
    peg$discard_();
    if (input.substr(peg$currPos,3) === "end") {
      r8 = true;
      peg$currPos += 3;
    } else {
      if (!silence) { peg$fail(peg$c82); }
      r8 = peg$FAILED;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_5;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r5 = true;
    } else {
      r5 = peg$FAILED;
    }
    if (r5 === peg$FAILED) {
      r5 = void 0;
    } else {
      r5 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_5;
    }
    // free p6
    r1 = true;
    } // seq_5
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a72(r10);
      break choice_1;
    }
    // free r14,r12,r9,r8,r5
    // free p3
    // free p2
    p2 = peg$currPos;
    seq_7: {
    p3 = peg$currPos;
    if (input.substr(peg$currPos,3) === "end") {
      r5 = true;
      peg$currPos += 3;
    } else {
      if (!silence) { peg$fail(peg$c82); }
      r5 = peg$FAILED;
      r1 = peg$FAILED;
      break seq_7;
    }
    p6 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r8 = true;
    } else {
      r8 = peg$FAILED;
    }
    if (r8 === peg$FAILED) {
      r8 = void 0;
    } else {
      r8 = peg$FAILED;
      peg$currPos = p6;
      peg$currPos = p3;
      r1 = peg$FAILED;
      break seq_7;
    }
    // free p6
    r1 = true;
    } // seq_7
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a43();
    }
    // free r5,r8
    // free p3
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseTryCatch(silence) {
    var r1,p2,r4,p5;
    seq_1: {
    p2 = peg$currPos;
    if (input.substr(peg$currPos,5) === "catch") {
      peg$currPos += 5;
    } else {
      if (!silence) { peg$fail(peg$c83); }
      r1 = peg$FAILED;
      break seq_1;
    }
    p5 = peg$currPos;
    if (/^[0-9A-Z_a-z]/.test(input.charAt(peg$currPos))) {
      r4 = true;
    } else {
      r4 = peg$FAILED;
    }
    if (r4 === peg$FAILED) {
      r4 = void 0;
    } else {
      r4 = peg$FAILED;
      peg$currPos = p5;
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p5
    peg$discard_();
    seq_2: {
    p5 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p5;
    } else {
      if (!silence) { peg$fail(peg$c56); }
      r1 = peg$FAILED;
      break seq_2;
    }
    r1 = peg$parsePostfix(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p5;
      r1 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p5
    } // seq_1
    // free r6
    // free p2
    return r1;
  }
  function peg$parseForeachExtract(silence) {
    var r1,p2,p4;
    seq_1: {
    p2 = peg$currPos;
    peg$discard_();
    if (input.charCodeAt(peg$currPos) === 59) {
      peg$currPos += 1;
    } else {
      if (!silence) { peg$fail(peg$c7); }
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    peg$discard_();
    seq_2: {
    p4 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p4;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r1 = peg$FAILED;
      break seq_2;
    }
    r1 = peg$parsePipe(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p4;
      r1 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    // free p4
    } // seq_1
    // free r5
    // free p2
    return r1;
  }
  function peg$parseFuncArgs(silence) {
    var r1,p2,p3,r4,r6,r7,p8,p10;
    choice_1: {
    p2 = peg$currPos;
    seq_1: {
    p3 = peg$currPos;
    seq_2: {
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p3;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r4 = peg$FAILED;
      break seq_2;
    }
    r4 = peg$parsePipe(silence);
    if (r4===peg$FAILED) {
      peg$currPos = p3;
      r4 = peg$FAILED;
      break seq_2;
    }
    } // seq_2
    // first <- r4
    if (r4===peg$FAILED) {
      r1 = peg$FAILED;
      break seq_1;
    }
    r6 = [];
    for (;;) {
      seq_3: {
      p8 = peg$currPos;
      peg$discard_();
      if (input.charCodeAt(peg$currPos) === 59) {
        peg$currPos += 1;
      } else {
        if (!silence) { peg$fail(peg$c7); }
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      peg$discard_();
      seq_4: {
      p10 = peg$currPos;
      if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
        peg$currPos = p10;
      } else {
        if (!silence) { peg$fail(peg$c1); }
        r7 = peg$FAILED;
        break seq_4;
      }
      r7 = peg$parsePipe(silence);
      if (r7===peg$FAILED) {
        peg$currPos = p10;
        r7 = peg$FAILED;
        break seq_4;
      }
      } // seq_4
      if (r7===peg$FAILED) {
        peg$currPos = p8;
        r7 = peg$FAILED;
        break seq_3;
      }
      // free p10
      } // seq_3
      if (r7!==peg$FAILED) {
        r6.push(r7);
      } else {
        break;
      }
      // free r11
      // free p8
    }
    // rest <- r6
    // free r7
    // free r9
    r1 = true;
    } // seq_1
    if (r1!==peg$FAILED) {
      peg$savedPos = p2;
      r1 = peg$a9(r4, r6);
      break choice_1;
    }
    // free r5
    // free p3
    // free p2
    p2 = peg$currPos;
    r1 = true;
    peg$savedPos = p2;
    r1 = peg$a10();
    // free p2
    } // choice_1
    return r1;
  }
  function peg$parseSliceBound(silence) {
    var r1,p2;
    seq_1: {
    p2 = peg$currPos;
    if (/^["$'-(\--.0-9@-[_a-{]/.test(input.charAt(peg$currPos))) {
      peg$currPos = p2;
    } else {
      if (!silence) { peg$fail(peg$c1); }
      r1 = peg$FAILED;
      break seq_1;
    }
    r1 = peg$parsePipe(silence);
    if (r1===peg$FAILED) {
      peg$currPos = p2;
      r1 = peg$FAILED;
      break seq_1;
    }
    } // seq_1
    if (r1===peg$FAILED) {
      r1 = null;
    }
    // free p2
    return r1;
  }

  // start

  if (options.stream) {
    switch (peg$startRule) {
      
      default:
        throw new Error(`Can't stream rule "${peg$startRule}".`);
    }
  } else {
    switch (peg$startRule) {
      case '(DEFAULT)':
      case "start":
        peg$result = peg$parsestart(false);
        break;
      default:
        throw new Error(`Can't start parsing from rule "${peg$startRule}".`);
    }
  }

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$c0);
    }
    throw peg$buildParseException();
  }
}

return {
  SyntaxError:   peg$SyntaxError,
  DefaultTracer: peg$DefaultTracer,
  parse: peg$parse
};

})();

class JQError extends Error {
    jqValue;
    constructor(message, jqValue) {
        super(message);
        this.name = new.target.name;
        this.jqValue = jqValue !== undefined ? jqValue : message;
    }
}

// Generated file — do not edit directly. Regenerate with: npm run build-stdenv
class JQBuiltin {
	static AST = {"type":"def","name":"halt_error","params":[],"body":{"type":"call","name":"halt_error","args":[{"type":"literal","value":5}]},"rest":{"type":"def","name":"error","params":[{"kind":"filter","name":"msg"}],"body":{"type":"pipe","left":{"type":"call","name":"msg","args":[]},"right":{"type":"call","name":"error","args":[]}},"rest":{"type":"def","name":"map","params":[{"kind":"filter","name":"f"}],"body":{"type":"array","expr":{"type":"pipe","left":{"type":"iter","opt":false,"expr":{"type":"identity"}},"right":{"type":"call","name":"f","args":[]}}},"rest":{"type":"def","name":"select","params":[{"kind":"filter","name":"f"}],"body":{"type":"if","cond":{"type":"call","name":"f","args":[]},"then":{"type":"identity"},"else":{"type":"call","name":"empty","args":[]}},"rest":{"type":"def","name":"sort_by","params":[{"kind":"filter","name":"f"}],"body":{"type":"call","name":"_sort_by_impl","args":[{"type":"call","name":"map","args":[{"type":"array","expr":{"type":"call","name":"f","args":[]}}]}]},"rest":{"type":"def","name":"group_by","params":[{"kind":"filter","name":"f"}],"body":{"type":"call","name":"_group_by_impl","args":[{"type":"call","name":"map","args":[{"type":"array","expr":{"type":"call","name":"f","args":[]}}]}]},"rest":{"type":"def","name":"unique_by","params":[{"kind":"filter","name":"f"}],"body":{"type":"call","name":"_unique_by_impl","args":[{"type":"call","name":"map","args":[{"type":"array","expr":{"type":"call","name":"f","args":[]}}]}]},"rest":{"type":"def","name":"max_by","params":[{"kind":"filter","name":"f"}],"body":{"type":"call","name":"_max_by_impl","args":[{"type":"call","name":"map","args":[{"type":"array","expr":{"type":"call","name":"f","args":[]}}]}]},"rest":{"type":"def","name":"min_by","params":[{"kind":"filter","name":"f"}],"body":{"type":"call","name":"_min_by_impl","args":[{"type":"call","name":"map","args":[{"type":"array","expr":{"type":"call","name":"f","args":[]}}]}]},"rest":{"type":"def","name":"add","params":[{"kind":"filter","name":"f"}],"body":{"type":"reduce","src":{"type":"call","name":"f","args":[]},"pattern":{"type":"var_pattern","name":"x"},"init":{"type":"literal","value":null},"update":{"type":"binop","op":"+","left":{"type":"identity"},"right":{"type":"variable","name":"x"}}},"rest":{"type":"def","name":"add","params":[],"body":{"type":"call","name":"add","args":[{"type":"iter","opt":false,"expr":{"type":"identity"}}]},"rest":{"type":"def","name":"del","params":[{"kind":"filter","name":"f"}],"body":{"type":"call","name":"delpaths","args":[{"type":"array","expr":{"type":"call","name":"path","args":[{"type":"call","name":"f","args":[]}]}}]},"rest":{"type":"def","name":"abs","params":[],"body":{"type":"if","cond":{"type":"compare","op":"<","left":{"type":"identity"},"right":{"type":"literal","value":0}},"then":{"type":"neg","expr":{"type":"identity"}},"else":{"type":"identity"}},"rest":{"type":"def","name":"_assign","params":[{"kind":"filter","name":"paths"},{"kind":"value","name":"value"}],"body":{"type":"reduce","src":{"type":"call","name":"path","args":[{"type":"call","name":"paths","args":[]}]},"pattern":{"type":"var_pattern","name":"p"},"init":{"type":"identity"},"update":{"type":"call","name":"setpath","args":[{"type":"variable","name":"p"},{"type":"variable","name":"value"}]}},"rest":{"type":"def","name":"map_values","params":[{"kind":"filter","name":"f"}],"body":{"type":"assign","op":"|=","left":{"type":"iter","opt":false,"expr":{"type":"identity"}},"right":{"type":"call","name":"f","args":[]}},"rest":{"type":"def","name":"recurse","params":[{"kind":"filter","name":"f"}],"body":{"type":"def","name":"r","params":[],"body":{"type":"comma","left":{"type":"identity"},"right":{"type":"pipe","left":{"type":"call","name":"f","args":[]},"right":{"type":"call","name":"r","args":[]}}},"rest":{"type":"call","name":"r","args":[]}},"rest":{"type":"def","name":"recurse","params":[{"kind":"filter","name":"f"},{"kind":"filter","name":"cond"}],"body":{"type":"def","name":"r","params":[],"body":{"type":"comma","left":{"type":"identity"},"right":{"type":"pipe","left":{"type":"call","name":"f","args":[]},"right":{"type":"pipe","left":{"type":"call","name":"select","args":[{"type":"call","name":"cond","args":[]}]},"right":{"type":"call","name":"r","args":[]}}}},"rest":{"type":"call","name":"r","args":[]}},"rest":{"type":"def","name":"recurse","params":[],"body":{"type":"call","name":"recurse","args":[{"type":"iter","opt":true,"expr":{"type":"identity"}}]},"rest":{"type":"def","name":"to_entries","params":[],"body":{"type":"array","expr":{"type":"bind","expr":{"type":"iter","opt":false,"expr":{"type":"call","name":"keys_unsorted","args":[]}},"pattern":{"type":"var_pattern","name":"k"},"body":{"type":"object","pairs":[{"key":{"type":"literal","value":"key"},"value":{"type":"variable","name":"k"}},{"key":{"type":"literal","value":"value"},"value":{"type":"index","key":{"type":"variable","name":"k"},"opt":false,"expr":{"type":"identity"}}}]}}},"rest":{"type":"def","name":"from_entries","params":[],"body":{"type":"pipe","left":{"type":"call","name":"map","args":[{"type":"object","pairs":[{"key":{"type":"alternative","left":{"type":"field","expr":{"type":"identity"},"name":"key","opt":false},"right":{"type":"alternative","left":{"type":"field","expr":{"type":"identity"},"name":"Key","opt":false},"right":{"type":"alternative","left":{"type":"field","expr":{"type":"identity"},"name":"name","opt":false},"right":{"type":"field","expr":{"type":"identity"},"name":"Name","opt":false}}}},"value":{"type":"if","cond":{"type":"call","name":"has","args":[{"type":"literal","value":"value"}]},"then":{"type":"field","expr":{"type":"identity"},"name":"value","opt":false},"else":{"type":"field","expr":{"type":"identity"},"name":"Value","opt":false}}}]}]},"right":{"type":"alternative","left":{"type":"call","name":"add","args":[]},"right":{"type":"object","pairs":[]}}},"rest":{"type":"def","name":"with_entries","params":[{"kind":"filter","name":"f"}],"body":{"type":"pipe","left":{"type":"call","name":"to_entries","args":[]},"right":{"type":"pipe","left":{"type":"call","name":"map","args":[{"type":"call","name":"f","args":[]}]},"right":{"type":"call","name":"from_entries","args":[]}}},"rest":{"type":"def","name":"reverse","params":[],"body":{"type":"array","expr":{"type":"index","key":{"type":"binop","op":"-","left":{"type":"binop","op":"-","left":{"type":"call","name":"length","args":[]},"right":{"type":"literal","value":1}},"right":{"type":"call","name":"range","args":[{"type":"literal","value":0},{"type":"call","name":"length","args":[]}]}},"opt":false,"expr":{"type":"identity"}}},"rest":{"type":"def","name":"indices","params":[{"kind":"value","name":"i"}],"body":{"type":"if","cond":{"type":"and","left":{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"array"}},"right":{"type":"compare","op":"==","left":{"type":"pipe","left":{"type":"variable","name":"i"},"right":{"type":"call","name":"type","args":[]}},"right":{"type":"literal","value":"array"}}},"then":{"type":"index","key":{"type":"variable","name":"i"},"opt":false,"expr":{"type":"identity"}},"else":{"type":"if","cond":{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"array"}},"then":{"type":"index","key":{"type":"array","expr":{"type":"variable","name":"i"}},"opt":false,"expr":{"type":"identity"}},"else":{"type":"if","cond":{"type":"and","left":{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"string"}},"right":{"type":"compare","op":"==","left":{"type":"pipe","left":{"type":"variable","name":"i"},"right":{"type":"call","name":"type","args":[]}},"right":{"type":"literal","value":"string"}}},"then":{"type":"call","name":"_strindices","args":[{"type":"variable","name":"i"}]},"else":{"type":"index","key":{"type":"variable","name":"i"},"opt":false,"expr":{"type":"identity"}}}}},"rest":{"type":"def","name":"index","params":[{"kind":"value","name":"i"}],"body":{"type":"pipe","left":{"type":"call","name":"indices","args":[{"type":"variable","name":"i"}]},"right":{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"identity"}}},"rest":{"type":"def","name":"rindex","params":[{"kind":"value","name":"i"}],"body":{"type":"pipe","left":{"type":"call","name":"indices","args":[{"type":"variable","name":"i"}]},"right":{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"slice","from":{"type":"neg","expr":{"type":"literal","value":1}},"to":null,"opt":false,"expr":{"type":"identity"}}}},"rest":{"type":"def","name":"paths","params":[],"body":{"type":"pipe","left":{"type":"call","name":"path","args":[{"type":"call","name":"recurse","args":[]}]},"right":{"type":"call","name":"select","args":[{"type":"compare","op":">","left":{"type":"call","name":"length","args":[]},"right":{"type":"literal","value":0}}]}},"rest":{"type":"def","name":"paths","params":[{"kind":"filter","name":"node_filter"}],"body":{"type":"pipe","left":{"type":"call","name":"path","args":[{"type":"pipe","left":{"type":"call","name":"recurse","args":[]},"right":{"type":"call","name":"select","args":[{"type":"call","name":"node_filter","args":[]}]}}]},"right":{"type":"call","name":"select","args":[{"type":"compare","op":">","left":{"type":"call","name":"length","args":[]},"right":{"type":"literal","value":0}}]}},"rest":{"type":"def","name":"isfinite","params":[],"body":{"type":"and","left":{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"number"}},"right":{"type":"pipe","left":{"type":"call","name":"isinfinite","args":[]},"right":{"type":"call","name":"not","args":[]}}},"rest":{"type":"def","name":"arrays","params":[],"body":{"type":"call","name":"select","args":[{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"array"}}]},"rest":{"type":"def","name":"objects","params":[],"body":{"type":"call","name":"select","args":[{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"object"}}]},"rest":{"type":"def","name":"iterables","params":[],"body":{"type":"call","name":"select","args":[{"type":"pipe","left":{"type":"call","name":"type","args":[]},"right":{"type":"or","left":{"type":"compare","op":"==","left":{"type":"identity"},"right":{"type":"literal","value":"array"}},"right":{"type":"compare","op":"==","left":{"type":"identity"},"right":{"type":"literal","value":"object"}}}}]},"rest":{"type":"def","name":"booleans","params":[],"body":{"type":"call","name":"select","args":[{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"boolean"}}]},"rest":{"type":"def","name":"numbers","params":[],"body":{"type":"call","name":"select","args":[{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"number"}}]},"rest":{"type":"def","name":"normals","params":[],"body":{"type":"call","name":"select","args":[{"type":"call","name":"isnormal","args":[]}]},"rest":{"type":"def","name":"finites","params":[],"body":{"type":"call","name":"select","args":[{"type":"call","name":"isfinite","args":[]}]},"rest":{"type":"def","name":"strings","params":[],"body":{"type":"call","name":"select","args":[{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"string"}}]},"rest":{"type":"def","name":"nulls","params":[],"body":{"type":"call","name":"select","args":[{"type":"compare","op":"==","left":{"type":"identity"},"right":{"type":"literal","value":null}}]},"rest":{"type":"def","name":"values","params":[],"body":{"type":"call","name":"select","args":[{"type":"compare","op":"!=","left":{"type":"identity"},"right":{"type":"literal","value":null}}]},"rest":{"type":"def","name":"scalars","params":[],"body":{"type":"call","name":"select","args":[{"type":"pipe","left":{"type":"call","name":"type","args":[]},"right":{"type":"and","left":{"type":"compare","op":"!=","left":{"type":"identity"},"right":{"type":"literal","value":"array"}},"right":{"type":"compare","op":"!=","left":{"type":"identity"},"right":{"type":"literal","value":"object"}}}}]},"rest":{"type":"def","name":"join","params":[{"kind":"value","name":"x"}],"body":{"type":"alternative","left":{"type":"reduce","src":{"type":"iter","opt":false,"expr":{"type":"identity"}},"pattern":{"type":"var_pattern","name":"i"},"init":{"type":"literal","value":null},"update":{"type":"binop","op":"+","left":{"type":"if","cond":{"type":"compare","op":"==","left":{"type":"identity"},"right":{"type":"literal","value":null}},"then":{"type":"string","fmt":null,"parts":[]},"else":{"type":"binop","op":"+","left":{"type":"identity"},"right":{"type":"variable","name":"x"}}},"right":{"type":"pipe","left":{"type":"variable","name":"i"},"right":{"type":"if","cond":{"type":"or","left":{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"boolean"}},"right":{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"number"}}},"then":{"type":"call","name":"tostring","args":[]},"else":{"type":"alternative","left":{"type":"identity"},"right":{"type":"string","fmt":null,"parts":[]}}}}}},"right":{"type":"string","fmt":null,"parts":[]}},"rest":{"type":"def","name":"_flatten","params":[{"kind":"value","name":"x"}],"body":{"type":"reduce","src":{"type":"iter","opt":false,"expr":{"type":"identity"}},"pattern":{"type":"var_pattern","name":"i"},"init":{"type":"array","expr":null},"update":{"type":"if","cond":{"type":"pipe","left":{"type":"variable","name":"i"},"right":{"type":"and","left":{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"array"}},"right":{"type":"compare","op":"!=","left":{"type":"variable","name":"x"},"right":{"type":"literal","value":0}}}},"then":{"type":"binop","op":"+","left":{"type":"identity"},"right":{"type":"pipe","left":{"type":"variable","name":"i"},"right":{"type":"call","name":"_flatten","args":[{"type":"binop","op":"-","left":{"type":"variable","name":"x"},"right":{"type":"literal","value":1}}]}}},"else":{"type":"binop","op":"+","left":{"type":"identity"},"right":{"type":"array","expr":{"type":"variable","name":"i"}}}}},"rest":{"type":"def","name":"flatten","params":[{"kind":"value","name":"x"}],"body":{"type":"if","cond":{"type":"compare","op":"<","left":{"type":"variable","name":"x"},"right":{"type":"literal","value":0}},"then":{"type":"call","name":"error","args":[{"type":"literal","value":"flatten depth must not be negative"}]},"else":{"type":"call","name":"_flatten","args":[{"type":"variable","name":"x"}]}},"rest":{"type":"def","name":"flatten","params":[],"body":{"type":"call","name":"_flatten","args":[{"type":"neg","expr":{"type":"literal","value":1}}]},"rest":{"type":"def","name":"range","params":[{"kind":"value","name":"x"}],"body":{"type":"call","name":"range","args":[{"type":"literal","value":0},{"type":"variable","name":"x"}]},"rest":{"type":"def","name":"fromdateiso8601","params":[],"body":{"type":"pipe","left":{"type":"call","name":"strptime","args":[{"type":"literal","value":"%Y-%m-%dT%H:%M:%SZ"}]},"right":{"type":"call","name":"mktime","args":[]}},"rest":{"type":"def","name":"todateiso8601","params":[],"body":{"type":"call","name":"strftime","args":[{"type":"literal","value":"%Y-%m-%dT%H:%M:%SZ"}]},"rest":{"type":"def","name":"fromdate","params":[],"body":{"type":"call","name":"fromdateiso8601","args":[]},"rest":{"type":"def","name":"todate","params":[],"body":{"type":"call","name":"todateiso8601","args":[]},"rest":{"type":"def","name":"ltrimstr","params":[{"kind":"value","name":"left"}],"body":{"type":"if","cond":{"type":"call","name":"startswith","args":[{"type":"variable","name":"left"}]},"then":{"type":"slice","from":{"type":"pipe","left":{"type":"variable","name":"left"},"right":{"type":"call","name":"length","args":[]}},"to":null,"opt":false,"expr":{"type":"identity"}},"else":{"type":"identity"}},"rest":{"type":"def","name":"rtrimstr","params":[{"kind":"value","name":"right"}],"body":{"type":"if","cond":{"type":"call","name":"endswith","args":[{"type":"variable","name":"right"}]},"then":{"type":"slice","from":null,"to":{"type":"binop","op":"-","left":{"type":"call","name":"length","args":[]},"right":{"type":"pipe","left":{"type":"variable","name":"right"},"right":{"type":"call","name":"length","args":[]}}},"opt":false,"expr":{"type":"identity"}},"else":{"type":"identity"}},"rest":{"type":"def","name":"trimstr","params":[{"kind":"value","name":"val"}],"body":{"type":"pipe","left":{"type":"call","name":"ltrimstr","args":[{"type":"variable","name":"val"}]},"right":{"type":"call","name":"rtrimstr","args":[{"type":"variable","name":"val"}]}},"rest":{"type":"def","name":"match","params":[{"kind":"filter","name":"re"},{"kind":"filter","name":"mode"}],"body":{"type":"pipe","left":{"type":"call","name":"_match_impl","args":[{"type":"call","name":"re","args":[]},{"type":"call","name":"mode","args":[]},{"type":"literal","value":false}]},"right":{"type":"iter","opt":false,"expr":{"type":"identity"}}},"rest":{"type":"def","name":"match","params":[{"kind":"value","name":"val"}],"body":{"type":"bind","expr":{"type":"pipe","left":{"type":"variable","name":"val"},"right":{"type":"call","name":"type","args":[]}},"pattern":{"type":"var_pattern","name":"vt"},"body":{"type":"if","cond":{"type":"compare","op":"==","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":"string"}},"then":{"type":"call","name":"match","args":[{"type":"variable","name":"val"},{"type":"literal","value":null}]},"else":{"type":"if","cond":{"type":"and","left":{"type":"compare","op":"==","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":"array"}},"right":{"type":"compare","op":">","left":{"type":"pipe","left":{"type":"variable","name":"val"},"right":{"type":"call","name":"length","args":[]}},"right":{"type":"literal","value":1}}},"then":{"type":"call","name":"match","args":[{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"variable","name":"val"}},{"type":"index","key":{"type":"literal","value":1},"opt":false,"expr":{"type":"variable","name":"val"}}]},"else":{"type":"if","cond":{"type":"and","left":{"type":"compare","op":"==","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":"array"}},"right":{"type":"compare","op":">","left":{"type":"pipe","left":{"type":"variable","name":"val"},"right":{"type":"call","name":"length","args":[]}},"right":{"type":"literal","value":0}}},"then":{"type":"call","name":"match","args":[{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"variable","name":"val"}},{"type":"literal","value":null}]},"else":{"type":"call","name":"error","args":[{"type":"binop","op":"+","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":" not a string or array"}}]}}}}},"rest":{"type":"def","name":"test","params":[{"kind":"filter","name":"re"},{"kind":"filter","name":"mode"}],"body":{"type":"call","name":"_match_impl","args":[{"type":"call","name":"re","args":[]},{"type":"call","name":"mode","args":[]},{"type":"literal","value":true}]},"rest":{"type":"def","name":"test","params":[{"kind":"value","name":"val"}],"body":{"type":"bind","expr":{"type":"pipe","left":{"type":"variable","name":"val"},"right":{"type":"call","name":"type","args":[]}},"pattern":{"type":"var_pattern","name":"vt"},"body":{"type":"if","cond":{"type":"compare","op":"==","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":"string"}},"then":{"type":"call","name":"test","args":[{"type":"variable","name":"val"},{"type":"literal","value":null}]},"else":{"type":"if","cond":{"type":"and","left":{"type":"compare","op":"==","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":"array"}},"right":{"type":"compare","op":">","left":{"type":"pipe","left":{"type":"variable","name":"val"},"right":{"type":"call","name":"length","args":[]}},"right":{"type":"literal","value":1}}},"then":{"type":"call","name":"test","args":[{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"variable","name":"val"}},{"type":"index","key":{"type":"literal","value":1},"opt":false,"expr":{"type":"variable","name":"val"}}]},"else":{"type":"if","cond":{"type":"and","left":{"type":"compare","op":"==","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":"array"}},"right":{"type":"compare","op":">","left":{"type":"pipe","left":{"type":"variable","name":"val"},"right":{"type":"call","name":"length","args":[]}},"right":{"type":"literal","value":0}}},"then":{"type":"call","name":"test","args":[{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"variable","name":"val"}},{"type":"literal","value":null}]},"else":{"type":"call","name":"error","args":[{"type":"binop","op":"+","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":" not a string or array"}}]}}}}},"rest":{"type":"def","name":"capture","params":[{"kind":"filter","name":"re"},{"kind":"filter","name":"mods"}],"body":{"type":"pipe","left":{"type":"call","name":"match","args":[{"type":"call","name":"re","args":[]},{"type":"call","name":"mods","args":[]}]},"right":{"type":"reduce","src":{"type":"pipe","left":{"type":"field","expr":{"type":"identity"},"name":"captures","opt":false},"right":{"type":"pipe","left":{"type":"iter","opt":false,"expr":{"type":"identity"}},"right":{"type":"pipe","left":{"type":"call","name":"select","args":[{"type":"compare","op":"!=","left":{"type":"field","expr":{"type":"identity"},"name":"name","opt":false},"right":{"type":"literal","value":null}}]},"right":{"type":"object","pairs":[{"key":{"type":"field","expr":{"type":"identity"},"name":"name","opt":false},"value":{"type":"field","expr":{"type":"identity"},"name":"string","opt":false}}]}}}},"pattern":{"type":"var_pattern","name":"pair"},"init":{"type":"object","pairs":[]},"update":{"type":"binop","op":"+","left":{"type":"identity"},"right":{"type":"variable","name":"pair"}}}},"rest":{"type":"def","name":"capture","params":[{"kind":"value","name":"val"}],"body":{"type":"bind","expr":{"type":"pipe","left":{"type":"variable","name":"val"},"right":{"type":"call","name":"type","args":[]}},"pattern":{"type":"var_pattern","name":"vt"},"body":{"type":"if","cond":{"type":"compare","op":"==","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":"string"}},"then":{"type":"call","name":"capture","args":[{"type":"variable","name":"val"},{"type":"literal","value":null}]},"else":{"type":"if","cond":{"type":"and","left":{"type":"compare","op":"==","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":"array"}},"right":{"type":"compare","op":">","left":{"type":"pipe","left":{"type":"variable","name":"val"},"right":{"type":"call","name":"length","args":[]}},"right":{"type":"literal","value":1}}},"then":{"type":"call","name":"capture","args":[{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"variable","name":"val"}},{"type":"index","key":{"type":"literal","value":1},"opt":false,"expr":{"type":"variable","name":"val"}}]},"else":{"type":"if","cond":{"type":"and","left":{"type":"compare","op":"==","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":"array"}},"right":{"type":"compare","op":">","left":{"type":"pipe","left":{"type":"variable","name":"val"},"right":{"type":"call","name":"length","args":[]}},"right":{"type":"literal","value":0}}},"then":{"type":"call","name":"capture","args":[{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"variable","name":"val"}},{"type":"literal","value":null}]},"else":{"type":"call","name":"error","args":[{"type":"binop","op":"+","left":{"type":"variable","name":"vt"},"right":{"type":"literal","value":" not a string or array"}}]}}}}},"rest":{"type":"def","name":"scan","params":[{"kind":"value","name":"re"},{"kind":"value","name":"flags"}],"body":{"type":"pipe","left":{"type":"call","name":"match","args":[{"type":"variable","name":"re"},{"type":"binop","op":"+","left":{"type":"literal","value":"g"},"right":{"type":"variable","name":"flags"}}]},"right":{"type":"if","cond":{"type":"pipe","left":{"type":"field","expr":{"type":"identity"},"name":"captures","opt":false},"right":{"type":"compare","op":">","left":{"type":"call","name":"length","args":[]},"right":{"type":"literal","value":0}}},"then":{"type":"array","expr":{"type":"pipe","left":{"type":"field","expr":{"type":"identity"},"name":"captures","opt":false},"right":{"type":"pipe","left":{"type":"iter","opt":false,"expr":{"type":"identity"}},"right":{"type":"field","expr":{"type":"identity"},"name":"string","opt":false}}}},"else":{"type":"field","expr":{"type":"identity"},"name":"string","opt":false}}},"rest":{"type":"def","name":"scan","params":[{"kind":"value","name":"re"}],"body":{"type":"call","name":"scan","args":[{"type":"variable","name":"re"},{"type":"literal","value":null}]},"rest":{"type":"def","name":"splits","params":[{"kind":"value","name":"re"},{"kind":"value","name":"flags"}],"body":{"type":"index","key":{"type":"foreach","src":{"type":"comma","left":{"type":"call","name":"match","args":[{"type":"variable","name":"re"},{"type":"binop","op":"+","left":{"type":"variable","name":"flags"},"right":{"type":"literal","value":"g"}}]},"right":{"type":"literal","value":null}},"pattern":{"type":"obj_pattern","fields":[{"key":{"type":"literal","value":"offset"},"pattern":{"type":"var_pattern","name":"offset"}},{"key":{"type":"literal","value":"length"},"pattern":{"type":"var_pattern","name":"length"}}]},"init":{"type":"literal","value":null},"update":{"type":"object","pairs":[{"key":{"type":"literal","value":"start"},"value":{"type":"field","expr":{"type":"identity"},"name":"next","opt":false}},{"key":{"type":"literal","value":"end"},"value":{"type":"variable","name":"offset"}},{"key":{"type":"literal","value":"next"},"value":{"type":"binop","op":"+","left":{"type":"variable","name":"offset"},"right":{"type":"variable","name":"length"}}}]},"extract":null},"opt":false,"expr":{"type":"identity"}},"rest":{"type":"def","name":"splits","params":[{"kind":"value","name":"re"}],"body":{"type":"call","name":"splits","args":[{"type":"variable","name":"re"},{"type":"literal","value":null}]},"rest":{"type":"def","name":"split","params":[{"kind":"value","name":"re"},{"kind":"value","name":"flags"}],"body":{"type":"array","expr":{"type":"call","name":"splits","args":[{"type":"variable","name":"re"},{"type":"variable","name":"flags"}]}},"rest":{"type":"def","name":"sub","params":[{"kind":"value","name":"re"},{"kind":"filter","name":"s"},{"kind":"value","name":"flags"}],"body":{"type":"bind","expr":{"type":"identity"},"pattern":{"type":"var_pattern","name":"in"},"body":{"type":"alternative","left":{"type":"pipe","left":{"type":"reduce","src":{"type":"call","name":"match","args":[{"type":"variable","name":"re"},{"type":"variable","name":"flags"}]},"pattern":{"type":"var_pattern","name":"edit"},"init":{"type":"object","pairs":[{"key":{"type":"literal","value":"result"},"value":{"type":"array","expr":null}},{"key":{"type":"literal","value":"previous"},"value":{"type":"literal","value":0}}]},"update":{"type":"bind","expr":{"type":"slice","from":{"type":"field","expr":{"type":"identity"},"name":"previous","opt":false},"to":{"type":"pipe","left":{"type":"variable","name":"edit"},"right":{"type":"field","expr":{"type":"identity"},"name":"offset","opt":false}},"opt":false,"expr":{"type":"variable","name":"in"}},"pattern":{"type":"var_pattern","name":"gap"},"body":{"type":"bind","expr":{"type":"array","expr":{"type":"pipe","left":{"type":"reduce","src":{"type":"pipe","left":{"type":"variable","name":"edit"},"right":{"type":"pipe","left":{"type":"field","expr":{"type":"identity"},"name":"captures","opt":false},"right":{"type":"pipe","left":{"type":"iter","opt":false,"expr":{"type":"identity"}},"right":{"type":"pipe","left":{"type":"call","name":"select","args":[{"type":"compare","op":"!=","left":{"type":"field","expr":{"type":"identity"},"name":"name","opt":false},"right":{"type":"literal","value":null}}]},"right":{"type":"object","pairs":[{"key":{"type":"field","expr":{"type":"identity"},"name":"name","opt":false},"value":{"type":"field","expr":{"type":"identity"},"name":"string","opt":false}}]}}}}},"pattern":{"type":"var_pattern","name":"pair"},"init":{"type":"object","pairs":[]},"update":{"type":"binop","op":"+","left":{"type":"identity"},"right":{"type":"variable","name":"pair"}}},"right":{"type":"call","name":"s","args":[]}}},"pattern":{"type":"var_pattern","name":"inserts"},"body":{"type":"pipe","left":{"type":"reduce","src":{"type":"call","name":"range","args":[{"type":"literal","value":0},{"type":"pipe","left":{"type":"variable","name":"inserts"},"right":{"type":"call","name":"length","args":[]}}]},"pattern":{"type":"var_pattern","name":"ix"},"init":{"type":"identity"},"update":{"type":"assign","op":"+=","left":{"type":"index","key":{"type":"variable","name":"ix"},"opt":false,"expr":{"type":"field","expr":{"type":"identity"},"name":"result","opt":false}},"right":{"type":"binop","op":"+","left":{"type":"variable","name":"gap"},"right":{"type":"index","key":{"type":"variable","name":"ix"},"opt":false,"expr":{"type":"variable","name":"inserts"}}}}},"right":{"type":"assign","op":"=","left":{"type":"field","expr":{"type":"identity"},"name":"previous","opt":false},"right":{"type":"pipe","left":{"type":"variable","name":"edit"},"right":{"type":"binop","op":"+","left":{"type":"field","expr":{"type":"identity"},"name":"offset","opt":false},"right":{"type":"field","expr":{"type":"identity"},"name":"length","opt":false}}}}}}}},"right":{"type":"binop","op":"+","left":{"type":"iter","opt":false,"expr":{"type":"field","expr":{"type":"identity"},"name":"result","opt":false}},"right":{"type":"slice","from":{"type":"field","expr":{"type":"identity"},"name":"previous","opt":false},"to":null,"opt":false,"expr":{"type":"variable","name":"in"}}}},"right":{"type":"variable","name":"in"}}},"rest":{"type":"def","name":"sub","params":[{"kind":"value","name":"re"},{"kind":"filter","name":"s"}],"body":{"type":"call","name":"sub","args":[{"type":"variable","name":"re"},{"type":"call","name":"s","args":[]},{"type":"string","fmt":null,"parts":[]}]},"rest":{"type":"def","name":"gsub","params":[{"kind":"value","name":"re"},{"kind":"filter","name":"s"},{"kind":"filter","name":"flags"}],"body":{"type":"call","name":"sub","args":[{"type":"variable","name":"re"},{"type":"call","name":"s","args":[]},{"type":"binop","op":"+","left":{"type":"call","name":"flags","args":[]},"right":{"type":"literal","value":"g"}}]},"rest":{"type":"def","name":"gsub","params":[{"kind":"value","name":"re"},{"kind":"filter","name":"s"}],"body":{"type":"call","name":"sub","args":[{"type":"variable","name":"re"},{"type":"call","name":"s","args":[]},{"type":"literal","value":"g"}]},"rest":{"type":"def","name":"while","params":[{"kind":"filter","name":"cond"},{"kind":"filter","name":"update"}],"body":{"type":"def","name":"_while","params":[],"body":{"type":"if","cond":{"type":"call","name":"cond","args":[]},"then":{"type":"comma","left":{"type":"identity"},"right":{"type":"pipe","left":{"type":"call","name":"update","args":[]},"right":{"type":"call","name":"_while","args":[]}}},"else":{"type":"call","name":"empty","args":[]}},"rest":{"type":"call","name":"_while","args":[]}},"rest":{"type":"def","name":"until","params":[{"kind":"filter","name":"cond"},{"kind":"filter","name":"next"}],"body":{"type":"def","name":"_until","params":[],"body":{"type":"if","cond":{"type":"call","name":"cond","args":[]},"then":{"type":"identity"},"else":{"type":"pipe","left":{"type":"call","name":"next","args":[]},"right":{"type":"call","name":"_until","args":[]}}},"rest":{"type":"call","name":"_until","args":[]}},"rest":{"type":"def","name":"limit","params":[{"kind":"value","name":"n"},{"kind":"filter","name":"expr"}],"body":{"type":"if","cond":{"type":"compare","op":">","left":{"type":"variable","name":"n"},"right":{"type":"literal","value":0}},"then":{"type":"label","name":"out","body":{"type":"foreach","src":{"type":"call","name":"expr","args":[]},"pattern":{"type":"var_pattern","name":"item"},"init":{"type":"variable","name":"n"},"update":{"type":"binop","op":"-","left":{"type":"identity"},"right":{"type":"literal","value":1}},"extract":{"type":"comma","left":{"type":"variable","name":"item"},"right":{"type":"if","cond":{"type":"compare","op":"<=","left":{"type":"identity"},"right":{"type":"literal","value":0}},"then":{"type":"break","name":"out"},"else":{"type":"call","name":"empty","args":[]}}}}},"else":{"type":"if","cond":{"type":"compare","op":"==","left":{"type":"variable","name":"n"},"right":{"type":"literal","value":0}},"then":{"type":"call","name":"empty","args":[]},"else":{"type":"call","name":"error","args":[{"type":"literal","value":"limit doesn't support negative count"}]}}},"rest":{"type":"def","name":"skip","params":[{"kind":"value","name":"n"},{"kind":"filter","name":"expr"}],"body":{"type":"if","cond":{"type":"compare","op":">","left":{"type":"variable","name":"n"},"right":{"type":"literal","value":0}},"then":{"type":"foreach","src":{"type":"call","name":"expr","args":[]},"pattern":{"type":"var_pattern","name":"item"},"init":{"type":"variable","name":"n"},"update":{"type":"binop","op":"-","left":{"type":"identity"},"right":{"type":"literal","value":1}},"extract":{"type":"if","cond":{"type":"compare","op":"<","left":{"type":"identity"},"right":{"type":"literal","value":0}},"then":{"type":"variable","name":"item"},"else":{"type":"call","name":"empty","args":[]}}},"else":{"type":"if","cond":{"type":"compare","op":"==","left":{"type":"variable","name":"n"},"right":{"type":"literal","value":0}},"then":{"type":"call","name":"expr","args":[]},"else":{"type":"call","name":"error","args":[{"type":"literal","value":"skip doesn't support negative count"}]}}},"rest":{"type":"def","name":"range","params":[{"kind":"value","name":"init"},{"kind":"value","name":"upto"},{"kind":"value","name":"by"}],"body":{"type":"if","cond":{"type":"compare","op":">","left":{"type":"variable","name":"by"},"right":{"type":"literal","value":0}},"then":{"type":"pipe","left":{"type":"variable","name":"init"},"right":{"type":"call","name":"while","args":[{"type":"compare","op":"<","left":{"type":"identity"},"right":{"type":"variable","name":"upto"}},{"type":"binop","op":"+","left":{"type":"identity"},"right":{"type":"variable","name":"by"}}]}},"else":{"type":"if","cond":{"type":"compare","op":"<","left":{"type":"variable","name":"by"},"right":{"type":"literal","value":0}},"then":{"type":"pipe","left":{"type":"variable","name":"init"},"right":{"type":"call","name":"while","args":[{"type":"compare","op":">","left":{"type":"identity"},"right":{"type":"variable","name":"upto"}},{"type":"binop","op":"+","left":{"type":"identity"},"right":{"type":"variable","name":"by"}}]}},"else":{"type":"call","name":"empty","args":[]}}},"rest":{"type":"def","name":"first","params":[{"kind":"filter","name":"g"}],"body":{"type":"label","name":"out","body":{"type":"pipe","left":{"type":"call","name":"g","args":[]},"right":{"type":"comma","left":{"type":"identity"},"right":{"type":"break","name":"out"}}}},"rest":{"type":"def","name":"isempty","params":[{"kind":"filter","name":"g"}],"body":{"type":"call","name":"first","args":[{"type":"comma","left":{"type":"pipe","left":{"type":"call","name":"g","args":[]},"right":{"type":"literal","value":false}},"right":{"type":"literal","value":true}}]},"rest":{"type":"def","name":"all","params":[{"kind":"filter","name":"generator"},{"kind":"filter","name":"condition"}],"body":{"type":"call","name":"isempty","args":[{"type":"pipe","left":{"type":"call","name":"generator","args":[]},"right":{"type":"and","left":{"type":"call","name":"condition","args":[]},"right":{"type":"call","name":"empty","args":[]}}}]},"rest":{"type":"def","name":"any","params":[{"kind":"filter","name":"generator"},{"kind":"filter","name":"condition"}],"body":{"type":"pipe","left":{"type":"call","name":"isempty","args":[{"type":"pipe","left":{"type":"call","name":"generator","args":[]},"right":{"type":"or","left":{"type":"call","name":"condition","args":[]},"right":{"type":"call","name":"empty","args":[]}}}]},"right":{"type":"call","name":"not","args":[]}},"rest":{"type":"def","name":"all","params":[{"kind":"filter","name":"condition"}],"body":{"type":"call","name":"all","args":[{"type":"iter","opt":false,"expr":{"type":"identity"}},{"type":"call","name":"condition","args":[]}]},"rest":{"type":"def","name":"any","params":[{"kind":"filter","name":"condition"}],"body":{"type":"call","name":"any","args":[{"type":"iter","opt":false,"expr":{"type":"identity"}},{"type":"call","name":"condition","args":[]}]},"rest":{"type":"def","name":"all","params":[],"body":{"type":"call","name":"all","args":[{"type":"iter","opt":false,"expr":{"type":"identity"}},{"type":"identity"}]},"rest":{"type":"def","name":"any","params":[],"body":{"type":"call","name":"any","args":[{"type":"iter","opt":false,"expr":{"type":"identity"}},{"type":"identity"}]},"rest":{"type":"def","name":"nth","params":[{"kind":"value","name":"n"},{"kind":"filter","name":"g"}],"body":{"type":"if","cond":{"type":"compare","op":"<","left":{"type":"variable","name":"n"},"right":{"type":"literal","value":0}},"then":{"type":"call","name":"error","args":[{"type":"literal","value":"nth doesn't support negative indices"}]},"else":{"type":"call","name":"first","args":[{"type":"call","name":"skip","args":[{"type":"variable","name":"n"},{"type":"call","name":"g","args":[]}]}]}},"rest":{"type":"def","name":"first","params":[],"body":{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"identity"}},"rest":{"type":"def","name":"last","params":[],"body":{"type":"index","key":{"type":"neg","expr":{"type":"literal","value":1}},"opt":false,"expr":{"type":"identity"}},"rest":{"type":"def","name":"nth","params":[{"kind":"value","name":"n"}],"body":{"type":"index","key":{"type":"variable","name":"n"},"opt":false,"expr":{"type":"identity"}},"rest":{"type":"def","name":"combinations","params":[],"body":{"type":"if","cond":{"type":"compare","op":"==","left":{"type":"call","name":"length","args":[]},"right":{"type":"literal","value":0}},"then":{"type":"array","expr":null},"else":{"type":"bind","expr":{"type":"iter","opt":false,"expr":{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"identity"}}},"pattern":{"type":"var_pattern","name":"x"},"body":{"type":"bind","expr":{"type":"pipe","left":{"type":"slice","from":{"type":"literal","value":1},"to":null,"opt":false,"expr":{"type":"identity"}},"right":{"type":"call","name":"combinations","args":[]}},"pattern":{"type":"var_pattern","name":"y"},"body":{"type":"binop","op":"+","left":{"type":"array","expr":{"type":"variable","name":"x"}},"right":{"type":"variable","name":"y"}}}}},"rest":{"type":"def","name":"combinations","params":[{"kind":"filter","name":"n"}],"body":{"type":"bind","expr":{"type":"identity"},"pattern":{"type":"var_pattern","name":"dot"},"body":{"type":"pipe","left":{"type":"array","expr":{"type":"pipe","left":{"type":"call","name":"range","args":[{"type":"call","name":"n","args":[]}]},"right":{"type":"variable","name":"dot"}}},"right":{"type":"call","name":"combinations","args":[]}}},"rest":{"type":"def","name":"transpose","params":[],"body":{"type":"array","expr":{"type":"bind","expr":{"type":"call","name":"range","args":[{"type":"literal","value":0},{"type":"pipe","left":{"type":"call","name":"map","args":[{"type":"call","name":"length","args":[]}]},"right":{"type":"alternative","left":{"type":"call","name":"max","args":[]},"right":{"type":"literal","value":0}}}]},"pattern":{"type":"var_pattern","name":"i"},"body":{"type":"array","expr":{"type":"index","key":{"type":"variable","name":"i"},"opt":false,"expr":{"type":"iter","opt":false,"expr":{"type":"identity"}}}}}},"rest":{"type":"def","name":"in","params":[{"kind":"filter","name":"xs"}],"body":{"type":"bind","expr":{"type":"identity"},"pattern":{"type":"var_pattern","name":"x"},"body":{"type":"pipe","left":{"type":"call","name":"xs","args":[]},"right":{"type":"call","name":"has","args":[{"type":"variable","name":"x"}]}}},"rest":{"type":"def","name":"inside","params":[{"kind":"filter","name":"xs"}],"body":{"type":"bind","expr":{"type":"identity"},"pattern":{"type":"var_pattern","name":"x"},"body":{"type":"pipe","left":{"type":"call","name":"xs","args":[]},"right":{"type":"call","name":"contains","args":[{"type":"variable","name":"x"}]}}},"rest":{"type":"def","name":"repeat","params":[{"kind":"filter","name":"exp"}],"body":{"type":"def","name":"_repeat","params":[],"body":{"type":"comma","left":{"type":"call","name":"exp","args":[]},"right":{"type":"call","name":"_repeat","args":[]}},"rest":{"type":"call","name":"_repeat","args":[]}},"rest":{"type":"def","name":"inputs","params":[],"body":{"type":"try","body":{"type":"call","name":"repeat","args":[{"type":"call","name":"input","args":[]}]},"catch":{"type":"if","cond":{"type":"compare","op":"==","left":{"type":"identity"},"right":{"type":"literal","value":"break"}},"then":{"type":"call","name":"empty","args":[]},"else":{"type":"call","name":"error","args":[]}}},"rest":{"type":"def","name":"ascii_downcase","params":[],"body":{"type":"pipe","left":{"type":"call","name":"explode","args":[]},"right":{"type":"pipe","left":{"type":"call","name":"map","args":[{"type":"if","cond":{"type":"and","left":{"type":"compare","op":"<=","left":{"type":"literal","value":65},"right":{"type":"identity"}},"right":{"type":"compare","op":"<=","left":{"type":"identity"},"right":{"type":"literal","value":90}}},"then":{"type":"binop","op":"+","left":{"type":"identity"},"right":{"type":"literal","value":32}},"else":{"type":"identity"}}]},"right":{"type":"call","name":"implode","args":[]}}},"rest":{"type":"def","name":"ascii_upcase","params":[],"body":{"type":"pipe","left":{"type":"call","name":"explode","args":[]},"right":{"type":"pipe","left":{"type":"call","name":"map","args":[{"type":"if","cond":{"type":"and","left":{"type":"compare","op":"<=","left":{"type":"literal","value":97},"right":{"type":"identity"}},"right":{"type":"compare","op":"<=","left":{"type":"identity"},"right":{"type":"literal","value":122}}},"then":{"type":"binop","op":"-","left":{"type":"identity"},"right":{"type":"literal","value":32}},"else":{"type":"identity"}}]},"right":{"type":"call","name":"implode","args":[]}}},"rest":{"type":"def","name":"truncate_stream","params":[{"kind":"filter","name":"stream"}],"body":{"type":"bind","expr":{"type":"identity"},"pattern":{"type":"var_pattern","name":"n"},"body":{"type":"pipe","left":{"type":"literal","value":null},"right":{"type":"pipe","left":{"type":"call","name":"stream","args":[]},"right":{"type":"bind","expr":{"type":"identity"},"pattern":{"type":"var_pattern","name":"input"},"body":{"type":"if","cond":{"type":"compare","op":">","left":{"type":"pipe","left":{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"identity"}},"right":{"type":"call","name":"length","args":[]}},"right":{"type":"variable","name":"n"}},"then":{"type":"call","name":"setpath","args":[{"type":"array","expr":{"type":"literal","value":0}},{"type":"slice","from":{"type":"variable","name":"n"},"to":null,"opt":false,"expr":{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"variable","name":"input"}}}]},"else":{"type":"call","name":"empty","args":[]}}}}}},"rest":{"type":"def","name":"fromstream","params":[{"kind":"filter","name":"i"}],"body":{"type":"bind","expr":{"type":"object","pairs":[{"key":{"type":"literal","value":"x"},"value":{"type":"literal","value":null}},{"key":{"type":"literal","value":"e"},"value":{"type":"literal","value":false}}]},"pattern":{"type":"var_pattern","name":"init"},"body":{"type":"foreach","src":{"type":"call","name":"i","args":[]},"pattern":{"type":"var_pattern","name":"i"},"init":{"type":"variable","name":"init"},"update":{"type":"pipe","left":{"type":"if","cond":{"type":"field","expr":{"type":"identity"},"name":"e","opt":false},"then":{"type":"variable","name":"init"},"else":{"type":"identity"}},"right":{"type":"if","cond":{"type":"pipe","left":{"type":"variable","name":"i"},"right":{"type":"compare","op":"==","left":{"type":"call","name":"length","args":[]},"right":{"type":"literal","value":2}}},"then":{"type":"pipe","left":{"type":"call","name":"setpath","args":[{"type":"array","expr":{"type":"literal","value":"e"}},{"type":"pipe","left":{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"variable","name":"i"}},"right":{"type":"compare","op":"==","left":{"type":"call","name":"length","args":[]},"right":{"type":"literal","value":0}}}]},"right":{"type":"call","name":"setpath","args":[{"type":"binop","op":"+","left":{"type":"array","expr":{"type":"literal","value":"x"}},"right":{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"variable","name":"i"}}},{"type":"index","key":{"type":"literal","value":1},"opt":false,"expr":{"type":"variable","name":"i"}}]}},"else":{"type":"call","name":"setpath","args":[{"type":"array","expr":{"type":"literal","value":"e"}},{"type":"pipe","left":{"type":"index","key":{"type":"literal","value":0},"opt":false,"expr":{"type":"variable","name":"i"}},"right":{"type":"compare","op":"==","left":{"type":"call","name":"length","args":[]},"right":{"type":"literal","value":1}}}]}}},"extract":{"type":"if","cond":{"type":"field","expr":{"type":"identity"},"name":"e","opt":false},"then":{"type":"field","expr":{"type":"identity"},"name":"x","opt":false},"else":{"type":"call","name":"empty","args":[]}}}},"rest":{"type":"def","name":"tostream","params":[],"body":{"type":"bind","expr":{"type":"call","name":"path","args":[{"type":"def","name":"r","params":[],"body":{"type":"comma","left":{"type":"pipe","left":{"type":"iter","opt":true,"expr":{"type":"identity"}},"right":{"type":"call","name":"r","args":[]}},"right":{"type":"identity"}},"rest":{"type":"call","name":"r","args":[]}}]},"pattern":{"type":"var_pattern","name":"p"},"body":{"type":"pipe","left":{"type":"call","name":"getpath","args":[{"type":"variable","name":"p"}]},"right":{"type":"reduce","src":{"type":"call","name":"path","args":[{"type":"iter","opt":true,"expr":{"type":"identity"}}]},"pattern":{"type":"var_pattern","name":"q"},"init":{"type":"array","expr":{"type":"comma","left":{"type":"variable","name":"p"},"right":{"type":"identity"}}},"update":{"type":"array","expr":{"type":"binop","op":"+","left":{"type":"variable","name":"p"},"right":{"type":"variable","name":"q"}}}}}},"rest":{"type":"def","name":"walk","params":[{"kind":"filter","name":"f"}],"body":{"type":"def","name":"w","params":[],"body":{"type":"pipe","left":{"type":"if","cond":{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"object"}},"then":{"type":"call","name":"map_values","args":[{"type":"call","name":"w","args":[]}]},"else":{"type":"if","cond":{"type":"compare","op":"==","left":{"type":"call","name":"type","args":[]},"right":{"type":"literal","value":"array"}},"then":{"type":"call","name":"map","args":[{"type":"call","name":"w","args":[]}]},"else":{"type":"identity"}}},"right":{"type":"call","name":"f","args":[]}},"rest":{"type":"call","name":"w","args":[]}},"rest":{"type":"def","name":"pick","params":[{"kind":"filter","name":"pathexps"}],"body":{"type":"bind","expr":{"type":"identity"},"pattern":{"type":"var_pattern","name":"in"},"body":{"type":"reduce","src":{"type":"call","name":"path","args":[{"type":"call","name":"pathexps","args":[]}]},"pattern":{"type":"var_pattern","name":"a"},"init":{"type":"literal","value":null},"update":{"type":"call","name":"setpath","args":[{"type":"variable","name":"a"},{"type":"pipe","left":{"type":"variable","name":"in"},"right":{"type":"call","name":"getpath","args":[{"type":"variable","name":"a"}]}}]}}},"rest":{"type":"def","name":"debug","params":[{"kind":"filter","name":"msgs"}],"body":{"type":"comma","left":{"type":"pipe","left":{"type":"call","name":"msgs","args":[]},"right":{"type":"pipe","left":{"type":"call","name":"debug","args":[]},"right":{"type":"call","name":"empty","args":[]}}},"right":{"type":"identity"}},"rest":{"type":"def","name":"INDEX","params":[{"kind":"filter","name":"stream"},{"kind":"filter","name":"idx_expr"}],"body":{"type":"reduce","src":{"type":"call","name":"stream","args":[]},"pattern":{"type":"var_pattern","name":"row"},"init":{"type":"object","pairs":[]},"update":{"type":"assign","op":"=","left":{"type":"index","key":{"type":"pipe","left":{"type":"variable","name":"row"},"right":{"type":"pipe","left":{"type":"call","name":"idx_expr","args":[]},"right":{"type":"call","name":"tostring","args":[]}}},"opt":false,"expr":{"type":"identity"}},"right":{"type":"variable","name":"row"}}},"rest":{"type":"def","name":"INDEX","params":[{"kind":"filter","name":"idx_expr"}],"body":{"type":"call","name":"INDEX","args":[{"type":"iter","opt":false,"expr":{"type":"identity"}},{"type":"call","name":"idx_expr","args":[]}]},"rest":{"type":"def","name":"JOIN","params":[{"kind":"value","name":"idx"},{"kind":"filter","name":"idx_expr"}],"body":{"type":"array","expr":{"type":"pipe","left":{"type":"iter","opt":false,"expr":{"type":"identity"}},"right":{"type":"array","expr":{"type":"comma","left":{"type":"identity"},"right":{"type":"index","key":{"type":"call","name":"idx_expr","args":[]},"opt":false,"expr":{"type":"variable","name":"idx"}}}}}},"rest":{"type":"def","name":"JOIN","params":[{"kind":"value","name":"idx"},{"kind":"filter","name":"stream"},{"kind":"filter","name":"idx_expr"}],"body":{"type":"pipe","left":{"type":"call","name":"stream","args":[]},"right":{"type":"array","expr":{"type":"comma","left":{"type":"identity"},"right":{"type":"index","key":{"type":"call","name":"idx_expr","args":[]},"opt":false,"expr":{"type":"variable","name":"idx"}}}}},"rest":{"type":"def","name":"JOIN","params":[{"kind":"value","name":"idx"},{"kind":"filter","name":"stream"},{"kind":"filter","name":"idx_expr"},{"kind":"filter","name":"join_expr"}],"body":{"type":"pipe","left":{"type":"call","name":"stream","args":[]},"right":{"type":"pipe","left":{"type":"array","expr":{"type":"comma","left":{"type":"identity"},"right":{"type":"index","key":{"type":"call","name":"idx_expr","args":[]},"opt":false,"expr":{"type":"variable","name":"idx"}}}},"right":{"type":"call","name":"join_expr","args":[]}}},"rest":{"type":"def","name":"IN","params":[{"kind":"filter","name":"s"}],"body":{"type":"call","name":"any","args":[{"type":"compare","op":"==","left":{"type":"call","name":"s","args":[]},"right":{"type":"identity"}},{"type":"identity"}]},"rest":{"type":"def","name":"IN","params":[{"kind":"filter","name":"src"},{"kind":"filter","name":"s"}],"body":{"type":"call","name":"any","args":[{"type":"compare","op":"==","left":{"type":"call","name":"src","args":[]},"right":{"type":"call","name":"s","args":[]}},{"type":"identity"}]},"rest":{"type":"call","name":"__env__","args":[]}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}};
	static getAst() { return this.AST; }
}

/**
 * Immutable lexical environment for JQ evaluation.
 *
 * Maps "name/arity" keys to compiled filter functions or filter
 * factories. bind() returns a new instance rather than mutating, so a
 * base env built from builtin.jq can be shared safely across many
 * independent evaluations. The IOContext object is shared by
 * reference across all envs derived from a common root.
 *
 * Path mode: when isPathMode() returns true, structural ops (field, index,
 * iter, etc.) yield [JQPathEnv, JQValue] pairs instead of bare values.
 * JQPathEnv carries the path accumulated so far as a linked chain of tail
 * segments; getPath() walks up the chain and reconstructs the full array
 * once, at the point where path/1 reads it.
 */
class JQEnv {
    parent;
    io;
    // eslint-disable-next-line no-use-before-define
    static stdEnv = null;
    /**
     * @param {JQEnv | null} parent Parent binding chain, or null for a root env
     * @param {IOContext} io Shared I/O context (same object across all derived envs)
     */
    constructor(parent, io) {
        this.parent = parent;
        this.io = io;
    }
    /**
     * Return a new env with one additional function binding.
     *
     * When arity is zero, the Binding should be a FilterFn.  Otherwise
     * the binding is a FilterFactory and all parameters are represented
     * as FilterFn: (input: JQValue, env: JQEnv) => Generator<JQValue>.
     *
     * @param {string} name Function name (may include a :: namespace)
     * @param {number} arity Number of filter arguments
     * @param {Binding} fn Compiled filter or filter factory
     * @return {JQEnv}
     */
    bind(name, arity, fn) {
        // eslint-disable-next-line no-use-before-define
        return new JQBindEnv(this, this.io, `${name}/${arity}`, fn);
    }
    /**
     * Look up a compiled function by name and arity.
     *
     * Returns null if no definition is found; the caller is responsible for
     * falling back to some other environment or raising a JQError.
     *
     * @param {string} name
     * @param {number} arity
     * @param {boolean} [cache] Whether to cache the result in the nearest JQBindEnv
     * @return {Binding | null}
     */
    lookup(name, arity, cache = true) {
        return this.parent?.lookup(name, arity, cache) ?? null;
    }
    /**
     * Return the shared standard-library environment, building it on first call.
     *
     * The env is built by evaluating src/builtin.jq with __env__ appended so
     * that all def statements register themselves and the resulting JQEnv is
     * returned. The env is then cached for the lifetime of the process.
     *
     * @return {JQEnv}
     */
    static getStdEnv() {
        if (JQEnv.stdEnv === null) {
            // The standard environment is built with a null IOContext
            // eslint-disable-next-line no-use-before-define
            JQEnv.stdEnv = new JQLazyEnv(new IOContext());
        }
        return JQEnv.stdEnv;
    }
    /**
     * Extend this environment with the jq definitions in defs.
     *
     * Compiles `${defs}\n__env__` with this env as the base, iterates the
     * results, and returns the first JQEnv value yielded (which carries all
     * newly defined functions as bindings).
     *
     * @param {string} defs jq source containing one or more def statements
     * @param {string} [filename] Optional source name for error messages
     * @throws {JQError} on syntax error
     * @return {JQEnv}
     */
    extendEnv(defs, filename) {
        const effectiveFilename = filename ?? '<definitions>';
        const f = JQ.compile(`${defs}\n__env__`, effectiveFilename, this);
        for (const val of f(null)) {
            if (val instanceof JQEnv) {
                return val;
            }
        }
        throw new JQError('JQEnv.extendEnv: __env__ was not yielded');
    }
    /**
     * Build the standard jq library environment by compiling builtin.jq on
     * top of baseEnv. JQLazyEnv passes its JQTopLevelEnv parent so that
     * native builtins are visible inside builtin.jq during compilation.
     *
     * @param {JQEnv} topLevelEnv The native-builtin env to compile on top of.
     * @return {JQEnv}
     */
    static buildStandardEnv(topLevelEnv) {
        const ast = JQBuiltin.getAst();
        const f = JQCompile.compile(ast, topLevelEnv);
        for (const val of f(null)) {
            if (val instanceof JQEnv) {
                return val;
            }
        }
        return assertNever('JQEnv.buildStandardEnv: __env__ was not yielded');
    }
    // -----------------------------------------------------------------------
    // Path mode
    // -----------------------------------------------------------------------
    /**
     * Returns true when structural ops should yield [pathEnv, value] pairs.
     *
     * @return {boolean}
     */
    isPathMode() {
        return false;
    }
    /**
     * Return a new env that is the root of a fresh path-collection context.
     * The returned env is in path mode with an empty path.
     *
     * @return {JQEnv}
     */
    enterPathMode() {
        // eslint-disable-next-line no-use-before-define
        return new JQPathEnv(this, this.io, null, null, false);
    }
    /**
     * If pathParent is in path mode, enter path mode with pathParent
     * as the path parent so that getPath() chains through it. This is
     * used for re-rooting when threading path context across def/pipe
     * boundaries.
     *
     * @param {JQEnv} pathParent Existing path chain to re-root onto, if it is
     *   a JQPathEnv
     * @return {JQEnv}
     */
    maybeEnterPathMode(pathParent) {
        if (pathParent.isPathMode()) {
            // eslint-disable-next-line no-use-before-define
            return new JQPathEnv(this, this.io, pathParent, null, false);
        }
        return this;
    }
    /**
     * Extend the current path by one key.
     * In normal mode returns this unchanged (fast path, no allocation).
     * In path mode returns a new env whose pathKey is `key` and whose parent
     * is `this`; getPath() will prepend `this`'s path to `key`.
     *
     * @param {JQValue} _key
     * @return {JQEnv}
     */
    appendPath(_key) {
        // Not in path mode, throw away the key
        return this;
    }
    /**
     * Return an env with path mode disabled, for evaluating conditions and
     * key expressions that must not themselves produce path-mode outputs.
     * In normal mode returns this unchanged (fast path, no allocation).
     *
     * @return {JQEnv}
     */
    leavePathMode() {
        return this;
    }
    /**
     * Reconstruct the full path array for this env.
     * Only callable on JQPathEnv; the base implementation always throws.
     *
     * @throws {Error} always in normal mode; subclass overrides return a value
     * @return {JQValue[]}
     */
    getPath() {
        return assertNever('not in path mode');
    }
    /**
     * Wrap value with path context when in path mode.
     * Normal mode: returns value unchanged.
     * Path mode:   returns [this, value].
     *
     * Used at the yield site in every structural compile* method.
     *
     * @param {JQValue} value
     * @return {JQValueOrPath}
     */
    maybeWithPath(value) {
        return value;
    }
    /**
     * Unwrap a potentially path-wrapped generator output.
     * Always returns [nextEnv, value].
     * Normal mode: [this, item]  (identity).
     * Path mode:   [item[0], item[1]]  (unwraps the [pathEnv, value] pair).
     *
     * Used in compilePipe to thread the path env into the right-hand side.
     *
     * @param {JQValueOrPath} item
     * @return {Array}
     */
    maybeUnwrapPath(item) {
        return [this, item];
    }
    /**
     * Extract the full path array from a path-mode generator output.
     * item must be a [pathEnv, value] pair produced by maybeWithPath().
     * Only meaningful when in path mode; used exclusively by path/1.
     *
     * @param {JQValueOrPath} item
     * @return {JQValue[]}
     */
    extractPath(item) {
        return item[0].getPath();
    }
}
/**
 * A JQEnv node that holds exactly one compiled function binding.
 *
 * Every call to JQEnv.bind() produces a JQBindEnv wrapping the previous
 * env in the parent chain. lookup() checks the local key first, then
 * delegates upward and caches the result so repeated lookups through a
 * deep chain are O(1) after the first miss.
 */
class JQBindEnv extends JQEnv {
    key;
    binding;
    localCache = null;
    /**
     * @param {JQEnv} parent Parent env for chained lookups
     * @param {IOContext} io Shared I/O context
     * @param {string} key "name/arity" key (e.g. "map/1", "length/0")
     * @param {Binding} binding Compiled binding for key
     */
    constructor(parent, io, key, binding) {
        super(parent, io);
        this.key = key;
        this.binding = binding;
    }
    lookup(name, arity, cache = true) {
        const key = `${name}/${arity}`;
        if (key === this.key) {
            return this.binding;
        }
        const cached = this.localCache?.get(key);
        if (cached !== undefined) {
            return cached;
        }
        // Pass cache=false so only the outermost JQBindEnv caches each result.
        const result = super.lookup(name, arity, false);
        if (cache) {
            if (this.localCache === null) {
                this.localCache = new Map();
            }
            // cache negative results (failed lookups) as well as positive
            this.localCache.set(key, result);
        }
        return result;
    }
}
/**
 * Subclass of JQEnv used in path mode to trace the path corresponding to
 * values collected, in addition to the usual functions of an env.
 *
 * Two-parent design: parent (inherited from JQEnv) is always a plain JQEnv
 * used exclusively for binding lookups. pathParent is the previous JQPathEnv
 * in the path chain, used exclusively by getPath(). The two chains are
 * completely independent, so binding depth and path depth do not affect
 * each other's performance.
 */
class JQPathEnv extends JQEnv {
    pathParent;
    pathKey;
    pathValid;
    constructor(parent, io, 
    /** Previous JQPathEnv in the path chain; null at the root. */
    pathParent, 
    /** The single path segment stored at this level; null when pathValid is false. */
    pathKey, 
    /** Whether this node contributes a key to the path (false for binding nodes). */
    pathValid) {
        super(parent, io);
        this.pathParent = pathParent;
        this.pathKey = pathKey;
        this.pathValid = pathValid;
    }
    /**
     * Insert binding into the plain-env parent chain; return new JQPathEnv at same path position.
     *
     * @param {string} name
     * @param {number} arity
     * @param {Binding} fn
     * @return {JQPathEnv}
     */
    bind(name, arity, fn) {
        const newEnv = this.parent.bind(name, arity, fn);
        return new JQPathEnv(newEnv, this.io, this.pathParent, this.pathKey, this.pathValid);
    }
    /** @return {boolean} */
    isPathMode() {
        return true;
    }
    enterPathMode() {
        assertNever('already in path mode');
    }
    maybeEnterPathMode(_pathParent) {
        assertNever('already in path mode');
    }
    /**
     * Extend the path chain by one step; binding parent is unchanged.
     *
     * @param {JQValue} key
     * @return {JQPathEnv}
     */
    appendPath(key) {
        return new JQPathEnv(this.parent, this.io, this, key, true);
    }
    /**
     * Return the plain-env binding parent, leaving path mode.
     *
     * @return {JQEnv}
     */
    leavePathMode() {
        if (this.parent === null) {
            assertNever('JQPathEnv has no binding parent');
        }
        return this.parent;
    }
    /**
     * Traverse pathParent chain collecting keys; reverse once at the end.
     *
     * @return {JQValue[]}
     */
    getPath() {
        const r = [];
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        for (let p = this; p !== null; p = p.pathParent) {
            if (p.pathValid) {
                r.push(p.pathKey);
            }
        }
        return r.reverse();
    }
    /**
     * Wrap value as a [this, value] pair for downstream path tracking.
     *
     * @param {JQValue} value
     * @return {JQValueOrPath}
     */
    maybeWithPath(value) {
        return [this, value];
    }
    /**
     * Unwrap a [JQPathEnv, value] pair; throws if item is not a valid path output.
     *
     * @param {JQValueOrPath} item
     * @return {Array}
     */
    maybeUnwrapPath(item) {
        if (!Array.isArray(item) || !(item[0] instanceof JQPathEnv)) {
            throw new JQError(`Invalid path expression with result ${jsonEncode(item)}`);
        }
        return item;
    }
}
/**
 * A JQEnv whose standard-library parent is resolved lazily on first lookup.
 *
 * The standard environment (JQEnv::getStdEnv()) is loaded only when
 * lookup() is first called, so the overhead of deserialising and compiling
 * builtin.jq is not paid unless a built-in function is actually invoked
 * during evaluation.
 *
 * bind() is inherited unchanged: it creates a JQBindEnv whose parent
 * chain eventually reaches this object, so unresolved lookups naturally
 * proxy through here to the standard library.
 */
class JQLazyEnv extends JQEnv {
    resolved = null;
    constructor(io) {
        super(new JQTopLevelEnv(io), io);
    }
    lookup(name, arity, cache = true) {
        if (this.resolved === null) {
            // Check native builtins (parent = JQTopLevelEnv) before
            // paying the cost of compiling builtin.jq; avoids a full
            // stdenv load when only native builtins are needed.
            const binding = super.lookup(name, arity, cache);
            if (binding !== null) {
                return binding;
            }
            // Ok, I guess we have to load the stdenv now.
            this.resolved = JQLazyEnv.buildStandardEnv(this.parent);
        }
        return this.resolved.lookup(name, arity, cache);
    }
}

/**
 * Utility functions for dealing with JQ values.
 *
 * JQ's semantics are very similar to, but not identical to, PHP and
 * JavaScript.  There is only one numeric type.  JQ defines its own
 * unique equality, comparison, and sorting operation, which handle
 * objects and arrays gracefully (unlike PHP and JavaScript).  JQ also
 * defines basic "arithmetic" operators, again in order to provide
 * more useful functionality for strings, arrays, and objects.
 */
// -----------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------
/** Maximum array or string size; prevents accidental huge allocations. */
const MAX_SIZE$1 = 1024 * 1024;
/** Maximum path size. */
const MAX_PATH = 10000;
// -----------------------------------------------------------------------
// Type selectors
// -----------------------------------------------------------------------
// Return true if v is a JQ number. JQ has a single numeric type, so every
// numeric check in the compiler goes through this helper to keep them consistent.
function isNumber$1(v) {
    return typeof v === 'number';
}
// Coerce a JQ value to a number.
// Numbers pass through unchanged; numeric strings are parsed.
// All other types throw JQError.
function toNumber(val) {
    const v = val;
    if (typeof v === 'number') {
        return v;
    }
    if (typeof v === 'string' && v === v.trim() && v !== '') {
        const n = +v;
        if (!isNaN(n)) {
            return n;
        }
    }
    throw new JQError(`${typeNameAndValue$1(v)} cannot be parsed as a number`);
}
// JQ truthiness: false and null are falsy; everything else is truthy
// (including 0, "", [], and {}).
function toBoolean$1(val) {
    const v = val;
    return v !== null && v !== false;
}
// Convert a JQ value to string with tostring semantics:
// strings pass through unchanged; everything else is JSON-encoded.
function toString(val) {
    const v = val;
    return typeof v === 'string' ? v : jsonEncode(v);
}
// Assert that val is a string and return it; throw JQError otherwise.
// who names the operation for the error message (e.g. 'explode').
function checkString$1(who, val) {
    const v = val;
    if (typeof v !== 'string') {
        throw new JQError(`${who} requires string inputs, got ${typeName$1(v)}`);
    }
    return v;
}
// Assert that all vals are strings and return them; throw JQError otherwise.
// who names the operation for the error message (e.g. 'explode').
function checkStrings(who, ...vals) {
    return vals.map((val) => checkString$1(who, val));
}
function isObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}
// Assert that val is an object and return it; throw JQError otherwise.
// who names the operation for the error message (e.g. 'field').
function checkObject$1(who, val) {
    const v = val;
    if (v === null || typeof v !== 'object' || Array.isArray(v)) {
        throw new JQError(`${who} requires an object input, got ${typeName$1(v)}`);
    }
    return v;
}
// Assert that val is an array and return it; throw JQError otherwise.
// who names the operation for the error message (e.g. 'implode').
function checkArray$1(who, val) {
    const v = val;
    if (!Array.isArray(v)) {
        throw new JQError(`${who} requires an array input, got ${typeName$1(v)}`);
    }
    return v;
}
// Assert that val is a number and return it; throw JQError otherwise.
// who names the operation for the error message (e.g. 'floor').
function checkNumber$1(who, val, allowNaN = true) {
    const v = val;
    if (typeof v !== 'number') {
        throw new JQError(`${who} requires a number input, got ${typeName$1(v)}`);
    }
    if (!allowNaN && isNaN(v)) {
        throw new JQError(`${who} requires a number input, got NaN`);
    }
    return v;
}
function adjustIndex$1(who, index, container) {
    const i0 = checkNumber$1(who, index);
    if (isNaN(i0)) {
        return null;
    }
    let i = Math.trunc(i0);
    const length = container.length;
    if (i < 0) {
        i += length;
    }
    return (i >= 0 && i < length) ? i : null;
}
// Return the JQ type name of a value, used in error messages.
function typeName$1(v) {
    if (v === null) {
        return 'null';
    }
    if (typeof v === 'boolean') {
        return 'boolean';
    }
    if (typeof v === 'number') {
        return 'number';
    }
    if (typeof v === 'string') {
        return 'string';
    }
    if (Array.isArray(v)) {
        return 'array';
    }
    return 'object';
}
// Format a value as "TYPE (value)" for inclusion in an error message,
// matching jq's style. Strings longer than 24 code points are truncated.
function typeNameAndValue$1(v) {
    const plain = v;
    let encoded;
    if (typeof plain === 'string') {
        let prefix = '';
        let count = 0;
        let long = false;
        for (const ch of plain) {
            if (count === 24) {
                long = true;
                break;
            }
            prefix += ch;
            count++;
        }
        encoded = long ? jsonEncode(prefix).slice(0, -1) + '..."' : jsonEncode(plain);
    }
    else {
        encoded = jsonEncode(plain);
    }
    return `${typeName$1(plain)} (${encoded})`;
}
// -----------------------------------------------------------------------
// Comparison and ordering
// -----------------------------------------------------------------------
// Structural JSON equality.
// Numbers use value equality (42 === 42.0). Arrays and objects are compared
// recursively by key-value pairs.
function equal$1(a, b) {
    if (typeof a === 'number') {
        return typeof b === 'number' && a === b;
    }
    if (a !== null && typeof a === 'object' && !Array.isArray(a)) {
        if (b === null || typeof b !== 'object' || Array.isArray(b)) {
            return false;
        }
        const ao = a;
        const bo = b;
        const ak = Object.keys(ao);
        if (ak.length !== Object.keys(bo).length) {
            return false;
        }
        for (const k of ak) {
            if (!Object.hasOwn(bo, k) || !equal$1(ao[k], bo[k])) {
                return false;
            }
        }
        return true;
    }
    if (!Array.isArray(a)) {
        return a === b; // null, bool, string
    }
    if (!Array.isArray(b) || a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (!equal$1(a[i], b[i])) {
            return false;
        }
    }
    return true;
}
// JQ cross-type ordering: null(0) < false(1) < true(2) < number(3) <
// string(4) < array(5) < object(6).
// Returns negative, zero, or positive like the spaceship operator.
function compare$1(a, b) {
    const order = (v) => {
        if (v === null) {
            return 0;
        }
        if (v === false) {
            return 1;
        }
        if (v === true) {
            return 2;
        }
        if (typeof v === 'number') {
            return 3;
        }
        if (typeof v === 'string') {
            return 4;
        }
        if (Array.isArray(v)) {
            return 5;
        }
        return 6; // object
    };
    const ta = order(a);
    const tb = order(b);
    if (ta !== tb) {
        return ta - tb;
    }
    if (ta <= 2) {
        return 0; // null or a specific boolean; only one value of this rank
    }
    if (ta <= 3) {
        // weird behavior with NaN
        if (isNaN(a)) {
            return -1;
        }
        if (isNaN(b)) {
            return 1;
        }
        // fall through
    }
    if (ta <= 4) {
        // number or string: use explicit comparisons to avoid Infinity - Infinity = NaN
        return a < b ? -1 :
            a > b ? 1 :
                0;
    }
    if (ta === 5) {
        // array: zip-compare then by length
        const aa = a;
        const ba = b;
        const len = Math.min(aa.length, ba.length);
        for (let i = 0; i < len; i++) {
            const c = compare$1(aa[i], ba[i]);
            if (c !== 0) {
                return c;
            }
        }
        return aa.length - ba.length;
    }
    // object: compare sorted keys, then values in key order
    const ao = a;
    const bo = b;
    const ka = Object.keys(ao).sort();
    const kb = Object.keys(bo).sort();
    const kc = compare$1(ka, kb);
    if (kc !== 0) {
        return kc;
    }
    for (const k of ka) {
        const c = compare$1(ao[k], bo[k]);
        if (c !== 0) {
            return c;
        }
    }
    return 0;
}
// -----------------------------------------------------------------------
// Binary operations
// -----------------------------------------------------------------------
// JQ addition: null acts as identity; numbers add; strings concatenate;
// arrays concatenate; objects merge (right keys overwrite left).
function add$1(a, b) {
    if (a === null) {
        return b;
    }
    if (b === null) {
        return a;
    }
    if (typeof a === 'number' && typeof b === 'number') {
        return a + b;
    }
    if (typeof a === 'string' && typeof b === 'string') {
        return a + b;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return [...a, ...b];
    }
    if (a !== null && typeof a === 'object' && !Array.isArray(a) &&
        b !== null && typeof b === 'object' && !Array.isArray(b)) {
        return { ...a, ...b };
    }
    throw new JQError(`${typeNameAndValue$1(a)} and ${typeNameAndValue$1(b)} cannot be added`);
}
// JQ subtraction: numbers subtract; arrays remove matching elements.
function subtract$1(a, b) {
    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.filter((item) => !b.some((bItem) => equal$1(item, bItem)));
    }
    throw new JQError(`${typeNameAndValue$1(a)} and ${typeNameAndValue$1(b)} cannot be subtracted`);
}
// JQ multiplication: numbers multiply; string * number repeats string;
// null * anything = null; objects are recursively merged.
function multiply$1(a, b) {
    if (a === null || b === null) {
        return null;
    }
    if (typeof a === 'number' && typeof b === 'number') {
        return a * b;
    }
    if (typeof a === 'string' && typeof b === 'number') {
        if (isNaN(b)) {
            return null;
        }
        const n = Math.floor(b);
        if (n < 0) {
            return null;
        }
        if (a === '' || n === 0) {
            return '';
        }
        if (n > MAX_SIZE$1 || a.length * n > MAX_SIZE$1) {
            throw new JQError('Repeat string result too long');
        }
        return a.repeat(n);
    }
    if (typeof a === 'number' && typeof b === 'string') {
        return multiply$1(b, a);
    }
    if (a !== null && typeof a === 'object' && !Array.isArray(a) &&
        b !== null && typeof b === 'object' && !Array.isArray(b)) {
        return mergeObjects(a, b);
    }
    throw new JQError(`${typeName$1(a)} and ${typeName$1(b)} cannot be multiplied`);
}
// Recursive object merge: values in b overwrite a, nested objects are merged.
function mergeObjects(a, b) {
    const result = { ...a };
    for (const [k, bVal] of Object.entries(b)) {
        const aVal = result[k];
        if (aVal !== undefined && aVal !== null && typeof aVal === 'object' &&
            !Array.isArray(aVal) && bVal !== null && typeof bVal === 'object' &&
            !Array.isArray(bVal)) {
            result[k] = mergeObjects(aVal, bVal);
        }
        else {
            result[k] = bVal;
        }
    }
    return result;
}
// JQ division: numbers divide (zero divisor throws); strings split by separator.
function divide$1(a, b) {
    if (typeof a === 'number' && typeof b === 'number') {
        if (b === 0) {
            throw new JQError(`${typeNameAndValue$1(a)} and ${typeNameAndValue$1(b)}` +
                ' cannot be divided because the divisor is zero');
        }
        return a / b;
    }
    if (typeof a === 'string' && typeof b === 'string') {
        return b === '' ? [...a] : a.split(b);
    }
    throw new JQError(`${typeNameAndValue$1(a)} and ${typeNameAndValue$1(b)} cannot be divided`);
}
// JQ modulo: floating-point remainder (zero divisor throws).
function modulo$1(a, b) {
    let extra = '';
    if (typeof a === 'number' && typeof b === 'number') {
        if (b !== 0) {
            return a % b;
        }
        extra = ' because the divisor is zero';
    }
    throw new JQError(`${typeNameAndValue$1(a)} and ${typeNameAndValue$1(b)} cannot be divided (remainder)${extra}`);
}
// Return a slice of an array or string.
// Null input yields null; other types throw JQError (unless opt is true).
function* slice$1(base, from, to, opt) {
    if (base === null) {
        yield null;
    }
    else if (opt && !(typeof from === 'number' && typeof to === 'number')) ;
    else if (typeof base === 'string') {
        const chars = [...base];
        const len = chars.length;
        const f = normalizeSliceIdx$1(from, len, 0, true, false);
        const t = normalizeSliceIdx$1(to, len, len, false, true);
        yield chars.slice(f, Math.max(f, t)).join('');
    }
    else if (Array.isArray(base)) {
        const len = base.length;
        const f = normalizeSliceIdx$1(from, len, 0, true, false);
        const t = normalizeSliceIdx$1(to, len, len, false, true);
        yield base.slice(f, Math.max(f, t));
    }
    else if (!opt) {
        throw new JQError(`${typeName$1(base)} cannot be sliced`);
    }
}
function normalizeSliceIdx$1(idx, len, defaultVal, floor = false, ceil = false) {
    const raw = idx === null ? defaultVal : idx;
    let i = checkNumber$1('slice', raw);
    if (isNaN(i)) {
        i = defaultVal;
    }
    else {
        i = floor ? Math.floor(i) : (ceil ? Math.ceil(i) : Math.trunc(i));
    }
    if (i < 0) {
        i += len;
    }
    return Math.min(Math.max(0, i), len);
}
// Throw a JQError when called inside a path-expression context.
// Add this to compile* methods that cannot produce valid path outputs
// (literals, arithmetic, object/array constructors, etc.).
function assertNotPath$1(value, env) {
    if (env.isPathMode()) {
        throw new JQError('Invalid path expression with result ' + jsonEncode(value));
    }
    return value;
}
// -----------------------------------------------------------------------
// JSON encode/decode
// -----------------------------------------------------------------------
// Decode a JSON string, stripping any leading Unicode BOM first (jq compatibility).
function jsonDecode(s) {
    const stripped = s.replace(/^\uFEFF/, ''); // strip BOM
    try {
        return JSON.parse(stripped);
    }
    catch {
        throw new JQError(`Invalid JSON: ${s}`);
    }
}
// Encoding failures result in "null" to match jq behavior.
function jsonEncode(v) {
    try {
        return JSON.stringify(v) ?? 'null';
    }
    catch {
        return 'null';
    }
}
// -----------------------------------------------------------------------
// Formatting operators
// -----------------------------------------------------------------------
// Return a formatter function for the named JQ format string.
// The returned function accepts any JQ value and returns a formatted string.
// Non-string values are first converted with toString(), except:
// @json always JSON-encodes (including strings, which get double-quoted);
// @csv and @tsv require an array and throw JQError otherwise.
// Valid format names: text, json, html, uri, urid, base64, base64d, sh, csv, tsv.
// Throws for unknown format names.
function formatterFor$1(fmt) {
    switch (fmt) {
        case 'text': return toString;
        case 'json': return jsonEncode;
        case 'html': return formatHtml;
        case 'uri': return formatUri;
        case 'urid': return formatUrid;
        case 'base64': return formatBase64;
        case 'base64d': return formatBase64d;
        case 'sh': return formatSh;
        case 'csv': return formatCsv;
        case 'tsv': return formatTsv;
        default: assertNever(`Unknown format: @${fmt}`);
    }
}
// HTML-escape: & < > " ' → &amp; &lt; &gt; &quot; &apos;
function formatHtml(val) {
    return toString(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
// Percent-encode every byte that is not unreserved (RFC 3986).
// encodeURIComponent leaves !'()*; additionally encode them for RFC 3986.
function formatUri(val) {
    return encodeURIComponent(toString(val))
        .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}
// Percent-decode a URI-encoded string.
// '+' is left as-is (unlike application/x-www-form-urlencoded decoding).
function formatUrid(val) {
    return decodeURIComponent(toString(val));
}
// Base64-encode the UTF-8 bytes of the string value.
function formatBase64(val) {
    return Buffer.from(toString(val)).toString('base64');
}
// Base64-decode, stripping leading/trailing whitespace first
// (common in multiline PEM blocks).
function formatBase64d(val) {
    return Buffer.from(toString(val).trim(), 'base64').toString();
}
// Single-quote shell-escape: wraps in ' and replaces embedded ' with '\''.
function formatSh(val) {
    return "'" + toString(val).replace(/'/g, "'\\''") + "'";
}
// Format an array as CSV: numbers are bare, strings are double-quoted with
// internal double-quotes doubled; values are comma-separated.
function formatCsv(val) {
    const arr = checkArray$1('@csv', val);
    const cols = arr.map((item) => {
        if (typeof item === 'number') {
            if (isNaN(item)) {
                return '';
            }
            return jsonEncode(item);
        }
        if (typeof item === 'string') {
            return '"' + item.replace(/"/g, '""') + '"';
        }
        if (item === true) {
            return 'true';
        }
        if (item === false) {
            return 'false';
        }
        if (item === null) {
            return '';
        }
        throw new JQError('@csv: invalid element type ' + typeName$1(item));
    });
    return cols.join(',');
}
// Format an array as TSV: values are tab-separated; tab, newline,
// carriage-return, and backslash in strings are backslash-escaped.
function formatTsv(val) {
    const arr = checkArray$1('@tsv', val);
    const cols = arr.map((item) => {
        if (typeof item === 'number') {
            if (isNaN(item)) {
                return '';
            }
            return jsonEncode(item);
        }
        if (typeof item === 'string') {
            return item
                .replace(/\\/g, '\\\\')
                .replace(/\t/g, '\\t')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r');
        }
        if (item === true) {
            return 'true';
        }
        if (item === false) {
            return 'false';
        }
        if (item === null) {
            return '';
        }
        throw new JQError('@tsv: invalid element type ' + typeName$1(item));
    });
    return cols.join('\t');
}

var JQUtils = /*#__PURE__*/Object.freeze({
	__proto__: null,
	MAX_PATH: MAX_PATH,
	MAX_SIZE: MAX_SIZE$1,
	add: add$1,
	adjustIndex: adjustIndex$1,
	assertNotPath: assertNotPath$1,
	checkArray: checkArray$1,
	checkNumber: checkNumber$1,
	checkObject: checkObject$1,
	checkString: checkString$1,
	checkStrings: checkStrings,
	compare: compare$1,
	divide: divide$1,
	equal: equal$1,
	formatterFor: formatterFor$1,
	isNumber: isNumber$1,
	isObject: isObject,
	jsonDecode: jsonDecode,
	jsonEncode: jsonEncode,
	modulo: modulo$1,
	multiply: multiply$1,
	normalizeSliceIdx: normalizeSliceIdx$1,
	slice: slice$1,
	subtract: subtract$1,
	toBoolean: toBoolean$1,
	toNumber: toNumber,
	toString: toString,
	typeName: typeName$1,
	typeNameAndValue: typeNameAndValue$1
});

const t0 = new Date, t1 = new Date;

function timeInterval(floori, offseti, count, field) {

  function interval(date) {
    return floori(date = arguments.length === 0 ? new Date : new Date(+date)), date;
  }

  interval.floor = (date) => {
    return floori(date = new Date(+date)), date;
  };

  interval.ceil = (date) => {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };

  interval.round = (date) => {
    const d0 = interval(date), d1 = interval.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };

  interval.offset = (date, step) => {
    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };

  interval.range = (start, stop, step) => {
    const range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
    let previous;
    do range.push(previous = new Date(+start)), offseti(start, step), floori(start);
    while (previous < start && start < stop);
    return range;
  };

  interval.filter = (test) => {
    return timeInterval((date) => {
      if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
    }, (date, step) => {
      if (date >= date) {
        if (step < 0) while (++step <= 0) {
          while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
        } else while (--step >= 0) {
          while (offseti(date, 1), !test(date)) {} // eslint-disable-line no-empty
        }
      }
    });
  };

  if (count) {
    interval.count = (start, end) => {
      t0.setTime(+start), t1.setTime(+end);
      floori(t0), floori(t1);
      return Math.floor(count(t0, t1));
    };

    interval.every = (step) => {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null
          : !(step > 1) ? interval
          : interval.filter(field
              ? (d) => field(d) % step === 0
              : (d) => interval.count(0, d) % step === 0);
    };
  }

  return interval;
}

const durationSecond = 1000;
const durationMinute = durationSecond * 60;
const durationHour = durationMinute * 60;
const durationDay = durationHour * 24;
const durationWeek = durationDay * 7;

const timeDay = timeInterval(
  date => date.setHours(0, 0, 0, 0),
  (date, step) => date.setDate(date.getDate() + step),
  (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay,
  date => date.getDate() - 1
);

timeDay.range;

const utcDay = timeInterval((date) => {
  date.setUTCHours(0, 0, 0, 0);
}, (date, step) => {
  date.setUTCDate(date.getUTCDate() + step);
}, (start, end) => {
  return (end - start) / durationDay;
}, (date) => {
  return date.getUTCDate() - 1;
});

utcDay.range;

const unixDay = timeInterval((date) => {
  date.setUTCHours(0, 0, 0, 0);
}, (date, step) => {
  date.setUTCDate(date.getUTCDate() + step);
}, (start, end) => {
  return (end - start) / durationDay;
}, (date) => {
  return Math.floor(date / durationDay);
});

unixDay.range;

function timeWeekday(i) {
  return timeInterval((date) => {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setDate(date.getDate() + step * 7);
  }, (start, end) => {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
  });
}

const timeSunday = timeWeekday(0);
const timeMonday = timeWeekday(1);
const timeTuesday = timeWeekday(2);
const timeWednesday = timeWeekday(3);
const timeThursday = timeWeekday(4);
const timeFriday = timeWeekday(5);
const timeSaturday = timeWeekday(6);

timeSunday.range;
timeMonday.range;
timeTuesday.range;
timeWednesday.range;
timeThursday.range;
timeFriday.range;
timeSaturday.range;

function utcWeekday(i) {
  return timeInterval((date) => {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, (start, end) => {
    return (end - start) / durationWeek;
  });
}

const utcSunday = utcWeekday(0);
const utcMonday = utcWeekday(1);
const utcTuesday = utcWeekday(2);
const utcWednesday = utcWeekday(3);
const utcThursday = utcWeekday(4);
const utcFriday = utcWeekday(5);
const utcSaturday = utcWeekday(6);

utcSunday.range;
utcMonday.range;
utcTuesday.range;
utcWednesday.range;
utcThursday.range;
utcFriday.range;
utcSaturday.range;

const timeYear = timeInterval((date) => {
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
}, (date, step) => {
  date.setFullYear(date.getFullYear() + step);
}, (start, end) => {
  return end.getFullYear() - start.getFullYear();
}, (date) => {
  return date.getFullYear();
});

// An optimized implementation for this simple case.
timeYear.every = (k) => {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : timeInterval((date) => {
    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setFullYear(date.getFullYear() + step * k);
  });
};

timeYear.range;

const utcYear = timeInterval((date) => {
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
}, (date, step) => {
  date.setUTCFullYear(date.getUTCFullYear() + step);
}, (start, end) => {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, (date) => {
  return date.getUTCFullYear();
});

// An optimized implementation for this simple case.
utcYear.every = (k) => {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : timeInterval((date) => {
    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCFullYear(date.getUTCFullYear() + step * k);
  });
};

utcYear.range;

function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}

function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}

function newDate(y, m, d) {
  return {y: y, m: m, d: d, H: 0, M: 0, S: 0, L: 0};
}

function formatLocale(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_weekdays = locale.days,
      locale_shortWeekdays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  var periodRe = formatRe(locale_periods),
      periodLookup = formatLookup(locale_periods),
      weekdayRe = formatRe(locale_weekdays),
      weekdayLookup = formatLookup(locale_weekdays),
      shortWeekdayRe = formatRe(locale_shortWeekdays),
      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
      monthRe = formatRe(locale_months),
      monthLookup = formatLookup(locale_months),
      shortMonthRe = formatRe(locale_shortMonths),
      shortMonthLookup = formatLookup(locale_shortMonths);

  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "f": formatMicroseconds,
    "g": formatYearISO,
    "G": formatFullYearISO,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "q": formatQuarter,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatSeconds,
    "u": formatWeekdayNumberMonday,
    "U": formatWeekNumberSunday,
    "V": formatWeekNumberISO,
    "w": formatWeekdayNumberSunday,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };

  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "f": formatUTCMicroseconds,
    "g": formatUTCYearISO,
    "G": formatUTCFullYearISO,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "q": formatUTCQuarter,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatUTCSeconds,
    "u": formatUTCWeekdayNumberMonday,
    "U": formatUTCWeekNumberSunday,
    "V": formatUTCWeekNumberISO,
    "w": formatUTCWeekdayNumberSunday,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };

  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "f": parseMicroseconds,
    "g": parseYear,
    "G": parseFullYear,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "q": parseQuarter,
    "Q": parseUnixTimestamp,
    "s": parseUnixTimestampSeconds,
    "S": parseSeconds,
    "u": parseWeekdayNumberMonday,
    "U": parseWeekNumberSunday,
    "V": parseWeekNumberISO,
    "w": parseWeekdayNumberSunday,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };

  // These recursive directive definitions must be deferred.
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);

  function newFormat(specifier, formats) {
    return function(date) {
      var string = [],
          i = -1,
          j = 0,
          n = specifier.length,
          c,
          pad,
          format;

      if (!(date instanceof Date)) date = new Date(+date);

      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
          else pad = c === "e" ? " " : "0";
          if (format = formats[c]) c = format(date, pad);
          string.push(c);
          j = i + 1;
        }
      }

      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }

  function newParse(specifier, Z) {
    return function(string) {
      var d = newDate(1900, undefined, 1),
          i = parseSpecifier(d, specifier, string += "", 0),
          week, day;
      if (i != string.length) return null;

      // If a UNIX timestamp is specified, return it.
      if ("Q" in d) return new Date(d.Q);
      if ("s" in d) return new Date(d.s * 1000 + ("L" in d ? d.L : 0));

      // If this is utcParse, never use the local timezone.
      if (Z && !("Z" in d)) d.Z = 0;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // If the month was not specified, inherit from the quarter.
      if (d.m === undefined) d.m = "q" in d ? d.q : 0;

      // Convert day-of-week and week-of-year to day-of-year.
      if ("V" in d) {
        if (d.V < 1 || d.V > 53) return null;
        if (!("w" in d)) d.w = 1;
        if ("Z" in d) {
          week = utcDate(newDate(d.y, 0, 1)), day = week.getUTCDay();
          week = day > 4 || day === 0 ? utcMonday.ceil(week) : utcMonday(week);
          week = utcDay.offset(week, (d.V - 1) * 7);
          d.y = week.getUTCFullYear();
          d.m = week.getUTCMonth();
          d.d = week.getUTCDate() + (d.w + 6) % 7;
        } else {
          week = localDate(newDate(d.y, 0, 1)), day = week.getDay();
          week = day > 4 || day === 0 ? timeMonday.ceil(week) : timeMonday(week);
          week = timeDay.offset(week, (d.V - 1) * 7);
          d.y = week.getFullYear();
          d.m = week.getMonth();
          d.d = week.getDate() + (d.w + 6) % 7;
        }
      } else if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
        day = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
      }

      // If a time zone is specified, all fields are interpreted as UTC and then
      // offset according to the specified time zone.
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }

      // Otherwise, all fields are in local time.
      return localDate(d);
    };
  }

  function parseSpecifier(d, specifier, string, j) {
    var i = 0,
        n = specifier.length,
        m = string.length,
        c,
        parse;

    while (i < n) {
      if (j >= m) return -1;
      c = specifier.charCodeAt(i++);
      if (c === 37) {
        c = specifier.charAt(i++);
        parse = parses[c in pads ? specifier.charAt(i++) : c];
        if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }

    return j;
  }

  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }

  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }

  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }

  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }

  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }

  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }

  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }

  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }

  function formatQuarter(d) {
    return 1 + ~~(d.getMonth() / 3);
  }

  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }

  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }

  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }

  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }

  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }

  function formatUTCQuarter(d) {
    return 1 + ~~(d.getUTCMonth() / 3);
  }

  return {
    format: function(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function() { return specifier; };
      return f;
    },
    parse: function(specifier) {
      var p = newParse(specifier += "", false);
      p.toString = function() { return specifier; };
      return p;
    },
    utcFormat: function(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function() { return specifier; };
      return f;
    },
    utcParse: function(specifier) {
      var p = newParse(specifier += "", true);
      p.toString = function() { return specifier; };
      return p;
    }
  };
}

var pads = {"-": "", "_": " ", "0": "0"},
    numberRe = /^\s*\d+/, // note: ignores next directive
    percentRe = /^%/,
    requoteRe = /[\\^$*+?|[\]().{}]/g;

function pad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function requote(s) {
  return s.replace(requoteRe, "\\$&");
}

function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}

function formatLookup(names) {
  return new Map(names.map((name, i) => [name.toLowerCase(), i]));
}

function parseWeekdayNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}

function parseWeekdayNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.u = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberISO(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.V = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}

function parseFullYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}

function parseYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
}

function parseZone(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}

function parseQuarter(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
}

function parseMonthNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}

function parseDayOfMonth(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}

function parseDayOfYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}

function parseHour24(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}

function parseMinutes(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}

function parseSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}

function parseMilliseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}

function parseMicroseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 6));
  return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
}

function parseLiteralPercent(d, string, i) {
  var n = percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function parseUnixTimestamp(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.Q = +n[0], i + n[0].length) : -1;
}

function parseUnixTimestampSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.s = +n[0], i + n[0].length) : -1;
}

function formatDayOfMonth(d, p) {
  return pad(d.getDate(), p, 2);
}

function formatHour24(d, p) {
  return pad(d.getHours(), p, 2);
}

function formatHour12(d, p) {
  return pad(d.getHours() % 12 || 12, p, 2);
}

function formatDayOfYear(d, p) {
  return pad(1 + timeDay.count(timeYear(d), d), p, 3);
}

function formatMilliseconds(d, p) {
  return pad(d.getMilliseconds(), p, 3);
}

function formatMicroseconds(d, p) {
  return formatMilliseconds(d, p) + "000";
}

function formatMonthNumber(d, p) {
  return pad(d.getMonth() + 1, p, 2);
}

function formatMinutes(d, p) {
  return pad(d.getMinutes(), p, 2);
}

function formatSeconds(d, p) {
  return pad(d.getSeconds(), p, 2);
}

function formatWeekdayNumberMonday(d) {
  var day = d.getDay();
  return day === 0 ? 7 : day;
}

function formatWeekNumberSunday(d, p) {
  return pad(timeSunday.count(timeYear(d) - 1, d), p, 2);
}

function dISO(d) {
  var day = d.getDay();
  return (day >= 4 || day === 0) ? timeThursday(d) : timeThursday.ceil(d);
}

function formatWeekNumberISO(d, p) {
  d = dISO(d);
  return pad(timeThursday.count(timeYear(d), d) + (timeYear(d).getDay() === 4), p, 2);
}

function formatWeekdayNumberSunday(d) {
  return d.getDay();
}

function formatWeekNumberMonday(d, p) {
  return pad(timeMonday.count(timeYear(d) - 1, d), p, 2);
}

function formatYear(d, p) {
  return pad(d.getFullYear() % 100, p, 2);
}

function formatYearISO(d, p) {
  d = dISO(d);
  return pad(d.getFullYear() % 100, p, 2);
}

function formatFullYear(d, p) {
  return pad(d.getFullYear() % 10000, p, 4);
}

function formatFullYearISO(d, p) {
  var day = d.getDay();
  d = (day >= 4 || day === 0) ? timeThursday(d) : timeThursday.ceil(d);
  return pad(d.getFullYear() % 10000, p, 4);
}

function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+"))
      + pad(z / 60 | 0, "0", 2)
      + pad(z % 60, "0", 2);
}

function formatUTCDayOfMonth(d, p) {
  return pad(d.getUTCDate(), p, 2);
}

function formatUTCHour24(d, p) {
  return pad(d.getUTCHours(), p, 2);
}

function formatUTCHour12(d, p) {
  return pad(d.getUTCHours() % 12 || 12, p, 2);
}

function formatUTCDayOfYear(d, p) {
  return pad(1 + utcDay.count(utcYear(d), d), p, 3);
}

function formatUTCMilliseconds(d, p) {
  return pad(d.getUTCMilliseconds(), p, 3);
}

function formatUTCMicroseconds(d, p) {
  return formatUTCMilliseconds(d, p) + "000";
}

function formatUTCMonthNumber(d, p) {
  return pad(d.getUTCMonth() + 1, p, 2);
}

function formatUTCMinutes(d, p) {
  return pad(d.getUTCMinutes(), p, 2);
}

function formatUTCSeconds(d, p) {
  return pad(d.getUTCSeconds(), p, 2);
}

function formatUTCWeekdayNumberMonday(d) {
  var dow = d.getUTCDay();
  return dow === 0 ? 7 : dow;
}

function formatUTCWeekNumberSunday(d, p) {
  return pad(utcSunday.count(utcYear(d) - 1, d), p, 2);
}

function UTCdISO(d) {
  var day = d.getUTCDay();
  return (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
}

function formatUTCWeekNumberISO(d, p) {
  d = UTCdISO(d);
  return pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
}

function formatUTCWeekdayNumberSunday(d) {
  return d.getUTCDay();
}

function formatUTCWeekNumberMonday(d, p) {
  return pad(utcMonday.count(utcYear(d) - 1, d), p, 2);
}

function formatUTCYear(d, p) {
  return pad(d.getUTCFullYear() % 100, p, 2);
}

function formatUTCYearISO(d, p) {
  d = UTCdISO(d);
  return pad(d.getUTCFullYear() % 100, p, 2);
}

function formatUTCFullYear(d, p) {
  return pad(d.getUTCFullYear() % 10000, p, 4);
}

function formatUTCFullYearISO(d, p) {
  var day = d.getUTCDay();
  d = (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
  return pad(d.getUTCFullYear() % 10000, p, 4);
}

function formatUTCZone() {
  return "+0000";
}

function formatLiteralPercent() {
  return "%";
}

function formatUnixTimestamp(d) {
  return +d;
}

function formatUnixTimestampSeconds(d) {
  return Math.floor(+d / 1000);
}

var locale;
var timeFormat;
var utcFormat;
var utcParse;

defaultLocale({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

function defaultLocale(definition) {
  locale = formatLocale(definition);
  timeFormat = locale.format;
  locale.parse;
  utcFormat = locale.utcFormat;
  utcParse = locale.utcParse;
  return locale;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// -----------------------------------------------------------------------
// Module-level constants
// -----------------------------------------------------------------------
// The character set from jq's jvp_codepoint_is_whitespace().
// JS's \s also includes \x00 (NUL) and some others; use explicit class instead.
const WS_CLASS = '[\\u0009-\\u000D\\u0020\\u0085\\u00A0\\u1680' +
    '\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000]';
const TRIM_BOTH = new RegExp(`^${WS_CLASS}+|${WS_CLASS}+$`, 'gu');
const TRIM_LEFT = new RegExp(`^${WS_CLASS}+`, 'gu');
const TRIM_RIGHT = new RegExp(`${WS_CLASS}+$`, 'gu');
// -----------------------------------------------------------------------
// Class
// -----------------------------------------------------------------------
/**
 * Root environment pre-populated with native JavaScript builtin functions.
 *
 * JQTopLevelEnv is the base of every evaluation's environment chain.
 * builtin.jq is compiled on top of it, so that jq-level library
 * functions can call native builtins without special-casing them inside
 * JQCompile.
 *
 * Arity-0 builtins are stored as FilterFn: (input, env) => Generator<JQValueOrPath>.
 * Arity-N builtins (N≥1) are stored as FilterFactory:
 *   (argFns: FilterFn[]) => FilterFn
 * matching the convention used by JQCompile.compileCall().
 */
class JQTopLevelEnv extends JQEnv {
    builtins;
    constructor(io) {
        super(null, io);
        this.builtins = JQTopLevelEnv.buildNativeBuiltins();
    }
    lookup(name, arity) {
        return this.builtins.get(`${name}/${arity}`) ?? null;
    }
    static buildNativeBuiltins() {
        const defs = new Map();
        const { jqContains, dateToJqArray, jqArrayToDate, dateToJqArrayLocal, jqArrayToDateLocal, checkTmArray, } = JQTopLevelEnv;
        // __env__/0 is a private builtin that yields the current JQEnv so
        // callers can capture it.
        // Used by bootstrapping code (JQEnv::buildStandardEnv) to extract
        // the startup env after a sequence of def statements has been
        // evaluated.
        defs.set('__env__/0', function* (_input, env) {
            // XXX should this be a JQValueOrPath? But this is still a JQEnv
            // not a JQPathEnv, so it wouldn't actually fix the type coercion.
            yield env;
        });
        // length/0 — null→0, array/object→count, string→codepoint length, number→abs
        defs.set('length/0', function* (input) {
            if (input === null) {
                yield 0;
            }
            else if (Array.isArray(input)) {
                yield input.length;
            }
            else if (typeof input === 'object') {
                yield Object.keys(input).length;
            }
            else if (typeof input === 'string') {
                yield [...input].length;
            }
            else if (isNumber$1(input)) {
                yield Math.abs(input);
            }
            else {
                throw new JQError(typeName$1(input) + ' has no length');
            }
        });
        // type/0
        defs.set('type/0', function* (input) {
            yield typeName$1(input);
        });
        // not/0 — JQ truthiness: null and false are falsy, everything else truthy
        defs.set('not/0', function* (input) {
            yield !toBoolean$1(input);
        });
        // empty/0 — produces no output
        defs.set('empty/0', function* () {
            yield* [];
        });
        // have_decnum/0, have_literal_numbers/0 — capability flags (always false: IEEE 754)
        defs.set('have_decnum/0', function* () {
            yield false;
        });
        defs.set('have_literal_numbers/0', function* () {
            yield false;
        });
        // error/0 — throw input as a JQError; jqValue carries the original value
        // eslint-disable-next-line require-yield
        defs.set('error/0', function* (input) {
            throw new JQError(toString(input), input);
        });
        // keys_unsorted/0 — object keys (insertion order) or array indices
        defs.set('keys_unsorted/0', function* (input) {
            if (Array.isArray(input)) {
                yield Array.from({ length: input.length }, (_, i) => i);
            }
            else if (isObject(input)) {
                yield Object.keys(input);
            }
            else {
                throw new JQError(typeName$1(input) + ' has no keys');
            }
        });
        // keys/0 — like keys_unsorted but lexicographically sorted
        defs.set('keys/0', function* (input) {
            if (Array.isArray(input)) {
                yield Array.from({ length: input.length }, (_, i) => i);
            }
            else if (isObject(input)) {
                yield Object.keys(input).sort();
            }
            else {
                throw new JQError(typeName$1(input) + ' has no keys');
            }
        });
        // has/1 — test whether an index/key is present
        defs.set('has/1', (argFns) => {
            const keyFn = argFns[0];
            return function* (input, env) {
                for (const key of keyFn(input, env)) {
                    if (Array.isArray(input)) {
                        const idx = adjustIndex$1('has', key, input);
                        yield idx !== null;
                    }
                    else if (isObject(input)) {
                        const k = checkString$1('has', key);
                        yield Object.prototype.hasOwnProperty.call(input, k);
                    }
                    else {
                        throw new JQError(typeName$1(input) + ' is not indexable');
                    }
                }
            };
        });
        // range/2 — range($from; $to), yields numbers from $from up to $to-1
        defs.set('range/2', (argFns) => {
            const [fromFn, toFn] = argFns;
            return function* (input, env) {
                for (const from of fromFn(input, env)) {
                    for (const to of toFn(input, env)) {
                        const f = checkNumber$1('range', from);
                        const t = checkNumber$1('range', to);
                        for (let i = f; i < t; i++) {
                            yield i;
                        }
                    }
                }
            };
        });
        // tostring/0 — strings pass through; everything else is JSON-encoded
        defs.set('tostring/0', function* (input) {
            yield toString(input);
        });
        // tojson/0 — always JSON-encode (including strings)
        defs.set('tojson/0', function* (input) {
            yield jsonEncode(input);
        });
        // fromjson/0 — parse a JSON string
        defs.set('fromjson/0', function* (input) {
            yield jsonDecode(checkString$1('fromjson', input));
        });
        // tonumber/0 — numbers pass through; strings are parsed
        defs.set('tonumber/0', function* (input) {
            yield toNumber(input);
        });
        // toboolean/0 — booleans pass through; "true"/"false" strings are converted
        defs.set('toboolean/0', function* (input) {
            if (typeof input === 'boolean') {
                yield input;
            }
            else if (input === 'true') {
                yield true;
            }
            else if (input === 'false') {
                yield false;
            }
            else {
                const repr = typeNameAndValue$1(input);
                throw new JQError(`${repr} cannot be parsed as a boolean`);
            }
        });
        // utf8bytelength/0 — byte length of a UTF-8 string
        defs.set('utf8bytelength/0', function* (input) {
            if (typeof input !== 'string') {
                const repr = typeNameAndValue$1(input);
                throw new JQError(`${repr} only strings have UTF-8 byte length`);
            }
            yield Buffer.byteLength(input, 'utf8');
        });
        // explode/0 — string → array of Unicode codepoints
        defs.set('explode/0', function* (input) {
            const str = checkString$1('explode', input);
            yield [...str].map((c) => c.codePointAt(0));
        });
        // implode/0 — array of Unicode codepoints → string
        defs.set('implode/0', function* (input) {
            const arr = checkArray$1('implode', input);
            const chars = arr.map((code) => {
                let n = Math.trunc(checkNumber$1('implode', code, false));
                if (n < 0 || n > 0x10FFFF || (n >= 0xD800 && n <= 0xDFFF)) {
                    n = 0xFFFD; // U+FFFD REPLACEMENT CHARACTER
                }
                return String.fromCodePoint(n);
            });
            yield chars.join('');
        });
        // startswith/1, endswith/1
        defs.set('startswith/1', (argFns) => {
            const prefixFn = argFns[0];
            return function* (input, env) {
                for (const prefix of prefixFn(input, env)) {
                    const [a, b] = checkStrings('startswith', input, prefix);
                    yield a.startsWith(b);
                }
            };
        });
        defs.set('endswith/1', (argFns) => {
            const suffixFn = argFns[0];
            return function* (input, env) {
                for (const suffix of suffixFn(input, env)) {
                    const [a, b] = checkStrings('endswith', input, suffix);
                    yield a.endsWith(b);
                }
            };
        });
        // split/1 — split string by a literal separator
        defs.set('split/1', (argFns) => {
            const sepFn = argFns[0];
            return function* (input, env) {
                for (const sep of sepFn(input, env)) {
                    const [str, delim] = checkStrings('split', input, sep);
                    yield delim === '' ? [...str] : str.split(delim);
                }
            };
        });
        // contains/1 — recursive containment check
        defs.set('contains/1', (argFns) => {
            const valFn = argFns[0];
            return function* (input, env) {
                for (const val of valFn(input, env)) {
                    yield jqContains(input, val);
                }
            };
        });
        // Math builtins — unary
        const mathFn = function (name, fn) {
            const f = fn ?? Math[name];
            return function* (input, _env) {
                yield f(checkNumber$1(name, input));
            };
        };
        defs.set('floor/0', mathFn('floor'));
        defs.set('ceil/0', mathFn('ceil'));
        defs.set('round/0', mathFn('round'));
        defs.set('acos/0', mathFn('acos'));
        defs.set('acosh/0', mathFn('acosh'));
        defs.set('asin/0', mathFn('asin'));
        defs.set('asinh/0', mathFn('asinh'));
        defs.set('atan/0', mathFn('atan'));
        defs.set('atanh/0', mathFn('atanh'));
        defs.set('cos/0', mathFn('cos'));
        defs.set('cosh/0', mathFn('cosh'));
        defs.set('exp/0', mathFn('exp'));
        defs.set('expm1/0', mathFn('expm1'));
        defs.set('fabs/0', mathFn('fabs', Math.abs));
        defs.set('log/0', mathFn('log'));
        defs.set('log10/0', mathFn('log10'));
        defs.set('log1p/0', mathFn('log1p'));
        defs.set('sin/0', mathFn('sin'));
        defs.set('sinh/0', mathFn('sinh'));
        defs.set('sqrt/0', mathFn('sqrt'));
        defs.set('tan/0', mathFn('tan'));
        defs.set('tanh/0', mathFn('tanh'));
        defs.set('cbrt/0', mathFn('cbrt'));
        defs.set('exp2/0', mathFn('exp2', (x) => 2 ** x));
        defs.set('exp10/0', mathFn('exp10', (x) => 10 ** x));
        defs.set('log2/0', mathFn('log2'));
        // nearbyint/rint: round half to even (banker's rounding)
        const roundHalfEven = (x) => {
            const f = Math.floor(x);
            const diff = x - f;
            if (diff < 0.5) {
                return f;
            }
            if (diff > 0.5) {
                return f + 1;
            }
            return f % 2 === 0 ? f : f + 1;
        };
        defs.set('nearbyint/0', mathFn('nearbyint', roundHalfEven));
        defs.set('rint/0', mathFn('rint', roundHalfEven));
        defs.set('trunc/0', mathFn('trunc', Math.trunc));
        // Omitted — no JS equivalent: erf, erfc, tgamma/gamma, lgamma,
        // j0, j1 (Bessel functions of the first kind), y0, y1 (second kind),
        // logb (IEEE exponent extraction), significand (IEEE significand).
        // Binary math functions (ignore input; take two args; right-outer, left-inner)
        const mathFn2 = (name, fn) => (argFns) => {
            const [leftFn, rightFn] = argFns;
            const f = fn ?? Math[name];
            return function* (input, env) {
                // for binops jq generally evaluates right first (outer loop)
                // then left (inner loop).
                for (const rv of rightFn(input, env)) {
                    const r = checkNumber$1(name, rv);
                    for (const lv of leftFn(input, env)) {
                        yield f(checkNumber$1(name, lv), r);
                    }
                }
            };
        };
        defs.set('atan2/2', mathFn2('atan2'));
        defs.set('fmod/2', mathFn2('fmod', (x, y) => x % y));
        defs.set('hypot/2', mathFn2('hypot'));
        defs.set('pow/2', mathFn2('pow'));
        defs.set('copysign/2', mathFn2('copysign', (x, y) => (y < 0 || Object.is(y, -0)) ? -Math.abs(x) : Math.abs(x)));
        defs.set('fdim/2', mathFn2('fdim', (x, y) => Math.max(x - y, 0)));
        defs.set('fmax/2', mathFn2('fmax', Math.max));
        defs.set('fmin/2', mathFn2('fmin', Math.min));
        // Special float values and predicates
        defs.set('nan/0', function* () {
            yield NaN;
        });
        defs.set('infinite/0', function* () {
            yield Infinity;
        });
        defs.set('isinfinite/0', function* (input) {
            yield typeof input === 'number' && !isFinite(input) && !isNaN(input);
        });
        defs.set('isnan/0', function* (input) {
            yield typeof input === 'number' && isNaN(input);
        });
        defs.set('isnormal/0', function* (input) {
            // "Normal": finite and nonzero (subnormals are not checked, matching PHP)
            yield typeof input === 'number' ?
                (isFinite(input) && input !== 0) :
                Number.isInteger(input);
        });
        // last/1 — yield the last output of expr; yield nothing if expr is empty
        defs.set('last/1', (argFns) => {
            const exprFn = argFns[0];
            return function* (input, env) {
                let last = null;
                let found = false;
                for (const val of exprFn(input, env)) {
                    last = val;
                    found = true;
                }
                if (found) {
                    yield last;
                }
            };
        });
        // halt/0, halt_error/1
        // eslint-disable-next-line require-yield
        defs.set('halt/0', function* () {
            throw new JQHaltException(0);
        });
        defs.set('halt_error/1', (argFns) => {
            const codeFn = argFns[0];
            // eslint-disable-next-line require-yield
            return function* (input, env) {
                // eslint-disable-next-line no-unreachable-loop
                for (const code of codeFn(input, env)) {
                    const c = Math.trunc(checkNumber$1('halt_error', code));
                    throw new JQHaltException(c, input !== null ? toString(input) : '');
                }
                throw new JQHaltException(0, input !== null ? toString(input) : '');
            };
        });
        // path/1 — yield the path(s) that expr traverses
        defs.set('path/1', (argFns) => {
            const exprFn = argFns[0];
            return function* (input, env) {
                const pathEnv = env.enterPathMode();
                for (const item of exprFn(input, pathEnv)) {
                    const [itemEnv] = pathEnv.maybeUnwrapPath(item);
                    yield itemEnv.getPath();
                }
            };
        });
        // getpath/1 — navigate input by the path array produced by $pathFn
        defs.set('getpath/1', (argFns) => {
            const pathFn = argFns[0];
            return function* (input, env) {
                for (const pathVal of pathFn(input, env.leavePathMode())) {
                    const path = checkArray$1('getpath', pathVal);
                    if (path.length > MAX_PATH) {
                        throw new JQError('Path too deep');
                    }
                    const result = JQCompile.getAtPath(input, path, 0);
                    if (env.isPathMode()) {
                        // Don't bother to do this iteration to transfer the
                        // array into a pathEnv chain unless we're actually
                        // in a nested path
                        let pathEnv = env;
                        for (const key of path) {
                            pathEnv = pathEnv.appendPath(key);
                        }
                        yield pathEnv.maybeWithPath(result);
                    }
                    else {
                        yield result;
                    }
                }
            };
        });
        // setpath/2 — return input with newVal written at the path array
        defs.set('setpath/2', (argFns) => {
            const [pathFn, valFn] = argFns;
            return function* (input, env) {
                const plain = env.leavePathMode();
                for (const pathVal of pathFn(input, plain)) {
                    const path = checkArray$1('setpath', pathVal);
                    if (path.length > MAX_PATH) {
                        throw new JQError('Path too deep');
                    }
                    for (const newVal of valFn(input, plain)) {
                        yield JQCompile.setAtPath(input, path, 0, newVal);
                    }
                }
            };
        });
        // delpaths/1 — delete all listed paths from the input
        defs.set('delpaths/1', (argFns) => {
            const pathsFn = argFns[0];
            return function* (input, env) {
                for (const paths of pathsFn(input, env)) {
                    yield JQCompile.deleteAtPaths(input, checkArray$1('delpaths', paths));
                }
            };
        });
        // trim/0, ltrim/0, rtrim/0 — strip Unicode whitespace
        defs.set('trim/0', function* (input) {
            yield checkString$1('trim', input).replace(TRIM_BOTH, '');
        });
        defs.set('ltrim/0', function* (input) {
            yield checkString$1('ltrim', input).replace(TRIM_LEFT, '');
        });
        defs.set('rtrim/0', function* (input) {
            yield checkString$1('rtrim', input).replace(TRIM_RIGHT, '');
        });
        // sort/0 — sort array by jq type ordering
        defs.set('sort/0', function* (input) {
            const arr = [...checkArray$1('sort', input)];
            arr.sort(compare$1);
            yield arr;
        });
        // unique/0 — sort then remove consecutive duplicates
        defs.set('unique/0', function* (input) {
            const arr = [...checkArray$1('unique', input)];
            arr.sort(compare$1);
            const result = [];
            let last = false;
            for (const v of arr) {
                if (result.length === 0 || compare$1(last, v) !== 0) {
                    result.push(v);
                    last = v;
                }
            }
            yield result;
        });
        const minmax = (name, cmp) => function* (input) {
            const arr = checkArray$1(name, input);
            let best = arr[0] ?? null;
            for (let i = 1; i < arr.length; i++) {
                if (cmp(arr[i], best)) {
                    best = arr[i];
                }
            }
            yield best;
        };
        const mincmp = (el, best) => compare$1(el, best) < 0;
        // On ties, max/max_by keeps last element
        const maxcmp = (el, best) => compare$1(el, best) >= 0;
        defs.set('min/0', minmax('min', mincmp));
        defs.set('max/0', minmax('max', maxcmp));
        // _min_by_impl/1 and _max_by_impl/1 — cores of min_by/1 and max_by/1.
        // Empty array yields null; otherwise a single linear scan finds the extremum.
        const minmaxBy = (name, cmp) => (argFns) => function* (input, env) {
            const arr = checkArray$1(name, input);
            const keyFn = argFns[0];
            for (const keysUnchecked of keyFn(input, env)) {
                const keys = checkArray$1(name, keysUnchecked);
                let bestVal = arr[0] ?? null;
                let bestKey = keys[0] ?? null;
                for (let i = 1; i < arr.length; i++) {
                    if (cmp(keys[i], bestKey)) {
                        bestVal = arr[i];
                        bestKey = keys[i];
                    }
                }
                yield bestVal;
            }
        };
        defs.set('_min_by_impl/1', minmaxBy('_min_by_impl', mincmp));
        defs.set('_max_by_impl/1', minmaxBy('_max_by_impl', maxcmp));
        // _sort_by_impl/1 — core of sort_by/1.
        // Called as _sort_by_impl(map([f])): receives input array and a pre-mapped
        // array of key-arrays (one per element); returns input sorted by those keys.
        defs.set('_sort_by_impl/1', (argFns) => function* (input, env) {
            const arr = checkArray$1('_sort_by_impl', input);
            const keysFn = argFns[0];
            for (const keysUnchecked of keysFn(input, env)) {
                const keys = checkArray$1('_sort_by_impl', keysUnchecked);
                // pair each value with its key, sort by key, extract values
                const pairs = arr.map((v, i) => [v, keys[i]]);
                pairs.sort((a, b) => compare$1(a[1], b[1]));
                yield pairs.map((p) => p[0]);
            }
        });
        // _unique_by_impl/1 — core of unique_by/1.
        // Sort by keys then keep only the first element of each run of equal keys.
        defs.set('_unique_by_impl/1', (argFns) => function* (input, env) {
            const arr = checkArray$1('_unique_by_impl', input);
            const keysFn = argFns[0];
            for (const keysUnchecked of keysFn(input, env)) {
                const keys = checkArray$1('_unique_by_impl', keysUnchecked);
                const pairs = arr.map((v, i) => [v, keys[i]]);
                pairs.sort((a, b) => compare$1(a[1], b[1]));
                const result = [];
                let prevKey = null;
                for (const [val, key] of pairs) {
                    if (result.length === 0 ||
                        compare$1(key, prevKey) !== 0) {
                        result.push(val);
                        prevKey = key;
                    }
                }
                yield result;
            }
        });
        // _group_by_impl/1 — core of group_by/1.
        // Same calling convention as _sort_by_impl; returns array of groups.
        defs.set('_group_by_impl/1', (argFns) => function* (input, env) {
            const arr = checkArray$1('_group_by_impl', input);
            const keysFn = argFns[0];
            for (const keysUnchecked of keysFn(input, env)) {
                const keys = checkArray$1('_group_by_impl', keysUnchecked);
                const pairs = arr.map((v, i) => [v, keys[i]]);
                pairs.sort((a, b) => compare$1(a[1], b[1]));
                const groups = [];
                let curGroup = [pairs[0][0]];
                let curKey = pairs[0][1];
                for (let i = 1; i < pairs.length; i++) {
                    if (compare$1(pairs[i][1], curKey) === 0) {
                        curGroup.push(pairs[i][0]);
                    }
                    else {
                        groups.push(curGroup);
                        curGroup = [pairs[i][0]];
                        curKey = pairs[i][1];
                    }
                }
                groups.push(curGroup);
                yield groups;
            }
        });
        // _strindices/1 — Unicode codepoint positions where needle occurs in input
        defs.set('_strindices/1', (argFns) => {
            const needleFn = argFns[0];
            return function* (input, env) {
                const str = checkString$1('_strindices', input);
                for (const needleUnchecked of needleFn(input, env)) {
                    const needle = checkString$1('_strindices', needleUnchecked);
                    const indices = [];
                    if (needle !== '') {
                        // O(N*M) codepoint-aware search for overlapping matches
                        const strCps = [...str];
                        const ndlCps = [...needle];
                        const nLen = ndlCps.length;
                        for (let i = 0; i <= strCps.length - nLen; i++) {
                            let ok = true;
                            for (let j = 0; j < nLen; j++) {
                                if (strCps[i + j] !== ndlCps[j]) {
                                    ok = false;
                                    break;
                                }
                            }
                            if (ok) {
                                indices.push(i);
                            }
                        }
                    }
                    yield indices;
                }
            };
        });
        // bsearch/1 — binary search on a sorted array.
        // Returns the index if found; -(insertion_point)-1 if not found.
        defs.set('bsearch/1', (argFns) => {
            const needleFn = argFns[0];
            return function* (input, env) {
                const arr = checkArray$1('bsearch', input);
                for (const needle of needleFn(input, env)) {
                    let lo = 0;
                    let hi = arr.length - 1;
                    let found = -1;
                    while (lo <= hi) {
                        // eslint-disable-next-line no-bitwise
                        const mid = (lo + hi) >>> 1;
                        const cmp = compare$1(arr[mid], needle);
                        if (cmp === 0) {
                            found = mid;
                            break;
                        }
                        else if (cmp < 0) {
                            lo = mid + 1;
                        }
                        else {
                            hi = mid - 1;
                        }
                    }
                    yield found >= 0 ? found : -lo - 1;
                }
            };
        });
        // -----------------------------------------------------------------------
        // Date/time builtins
        // -----------------------------------------------------------------------
        defs.set('now/0', function* () {
            // jq uses "seconds"; javascript uses "milliseconds"
            yield Date.now() / 1000;
        });
        defs.set('gmtime/0', function* (input) {
            const ts = checkNumber$1('gmtime', input);
            yield dateToJqArray(new Date(ts * 1000));
        });
        defs.set('localtime/0', function* (input) {
            const ts = checkNumber$1('localtime', input);
            yield dateToJqArrayLocal(new Date(ts * 1000));
        });
        defs.set('mktime/0', function* (input) {
            yield jqArrayToDate(checkTmArray('mktime', input)).getTime() / 1000;
        });
        defs.set('strftime/1', (argFns) => {
            const fmtFn = argFns[0];
            return function* (input, env) {
                for (const fmtVal of fmtFn(input, env)) {
                    const fmt = checkString$1('strftime/1', fmtVal);
                    let d;
                    if (isNumber$1(input)) {
                        d = new Date(input * 1000);
                    }
                    else {
                        d = jqArrayToDate(checkTmArray('strftime/1', input));
                    }
                    const formatter = utcFormat(fmt);
                    yield formatter(d);
                }
            };
        });
        defs.set('strflocaltime/1', (argFns) => {
            const fmtFn = argFns[0];
            return function* (input, env) {
                for (const fmtVal of fmtFn(input, env)) {
                    const fmt = checkString$1('strflocaltime/1', fmtVal);
                    let d;
                    if (isNumber$1(input)) {
                        d = new Date(input * 1000);
                    }
                    else {
                        d = jqArrayToDateLocal(checkTmArray('strflocaltime/1', input));
                    }
                    const formatter = timeFormat(fmt);
                    yield formatter(d);
                }
            };
        });
        defs.set('strptime/1', (argFns) => {
            const fmtFn = argFns[0];
            return function* (input, env) {
                for (const fmtVal of fmtFn(input, env)) {
                    const [str, fmt] = checkStrings('strptime/1', input, fmtVal);
                    const parser = utcParse(fmt);
                    const d = parser(str);
                    if (d === null) {
                        throw new JQError('Bad date');
                    }
                    yield dateToJqArray(d);
                }
            };
        });
        // builtins/0 — list public builtin names (no _ prefix, excludes builtins/0 itself)
        const names = [...defs.keys()].filter((k) => !k.startsWith('_')).sort();
        defs.set('builtins/0', function* () {
            yield names;
        });
        return defs;
    }
    /**
     * Check that a jq broken-down time array has all-numeric (non-NaN) elements.
     * Short arrays are allowed; the missing tail elements default to
     * 1970-01-01T00:00:00.00.
     *
     * @param {string} who
     * @param {JQValue} v
     * @return {number[]}
     */
    static checkTmArray(who, v) {
        const defaults = [1970, 0, 1, 0, 0, 0, 0, 0];
        const arr = checkArray$1(who, v);
        const result = [];
        for (let i = 0; i < 8; i++) {
            result.push(checkNumber$1(`${who} element ${i}`, arr[i] ?? defaults[i], false));
        }
        return result;
    }
    /**
     * Convert a jq broken-down UTC time array to a Date.
     * Array: [year, month(0-based), mday(1-based), hour, min, sec+frac, wday, yday].
     *
     * @param {number[]} arr
     * @return {Date}
     */
    static jqArrayToDate(arr) {
        const [year, month, day, hour, min, sec] = arr;
        const ms = Math.round(sec * 1000) % 1000;
        const d = new Date(0);
        d.setUTCFullYear(year, month, day);
        d.setUTCHours(hour, min, Math.floor(sec), ms);
        return d;
    }
    /**
     * Convert a jq broken-down local time array to a Date (local timezone).
     *
     * @param {number[]} arr
     * @return {Date}
     */
    static jqArrayToDateLocal(arr) {
        const [year, month, day, hour, min, sec] = arr;
        const ms = Math.round(sec * 1000) % 1000;
        const d = new Date(0);
        d.setFullYear(year, month, day);
        d.setHours(hour, min, Math.floor(sec), ms);
        return d;
    }
    /**
     * Convert a UTC Date + original float timestamp to a jq broken-down time array.
     *
     * @param {Date} d
     * @return {JQValue[]}
     */
    static dateToJqArray(d) {
        return [
            d.getUTCFullYear(),
            d.getUTCMonth(), // 0-based
            d.getUTCDate(), // 1-based
            d.getUTCHours(),
            d.getUTCMinutes(),
            d.getUTCSeconds() + (d.getUTCMilliseconds() / 1000),
            d.getUTCDay(), // 0=Sunday
            parseInt(utcFormat('%j')(d), 10) - 1, // 0-based
        ];
    }
    /**
     * Convert a local Date + original float timestamp to a jq broken-down time array.
     *
     * @param {Date} d
     * @return {JQValue[]}
     */
    static dateToJqArrayLocal(d) {
        return [
            d.getFullYear(),
            d.getMonth(), // 0-based
            d.getDate(), // 1-based
            d.getHours(),
            d.getMinutes(),
            d.getSeconds() + (d.getMilliseconds() / 1000),
            d.getDay(), // 0=Sunday
            parseInt(timeFormat('%j')(d), 10) - 1, // 0-based
        ];
    }
    // -----------------------------------------------------------------------
    // Other helpers
    // -----------------------------------------------------------------------
    /**
     * Recursive jq containment check used by contains/1.
     *
     * @param {JQValue} a
     * @param {JQValue} b
     * @return {boolean}
     */
    static jqContains(a, b) {
        if (typeof a === 'string' && typeof b === 'string') {
            return a.includes(b);
        }
        if (Array.isArray(a) && Array.isArray(b)) {
            for (const bItem of b) {
                if (!a.some((aItem) => JQTopLevelEnv.jqContains(aItem, bItem))) {
                    return false;
                }
            }
            return true;
        }
        if (a !== null && typeof a === 'object' && !Array.isArray(a) &&
            b !== null && typeof b === 'object' && !Array.isArray(b)) {
            const ao = a;
            const bo = b;
            for (const [k, bVal] of Object.entries(bo)) {
                if (!Object.prototype.hasOwnProperty.call(ao, k) ||
                    !JQTopLevelEnv.jqContains(ao[k], bVal)) {
                    return false;
                }
            }
            return true;
        }
        if (isNumber$1(a)) {
            // eslint-disable-next-line eqeqeq
            return isNumber$1(b) && a == b;
        }
        return a === b;
    }
}

const { assertNotPath, checkArray, checkNumber, checkObject, checkString, isNumber, adjustIndex, normalizeSliceIdx, slice, MAX_SIZE, toBoolean, typeName, typeNameAndValue, equal, compare, add, subtract, multiply, divide, modulo, formatterFor, } = JQUtils;
// Tombstone sentinel for deleteAtPaths — a unique object that cannot be
// produced by JSON.parse, so it cannot alias any user-supplied JQ value.
const TOMB = Object.freeze(Object.create(null));
class JQCompile {
    static compile(ast, env) {
        const compiler = new JQCompile();
        const fn = compiler.compileNode(ast);
        return function* (input) {
            for (const v of fn(input, env)) {
                yield assertNotPath(v, env);
            }
        };
    }
    /**
     * Compile one AST node into a FilterFn.
     *
     * The JQEnv is threaded at call time rather than captured at compile time.
     * This means runtime bindings — as-patterns, def scopes — can extend the
     * env without requiring the body subtree to be recompiled on each iteration.
     *
     * Lexical scoping for def: when binding a new function, the stored closure
     * calls the body with the definition-time env (captured via a forward
     * reference so that recursive calls work), ignoring the call-time env for
     * the body itself. See the 'def' case for details.
     *
     * @param {ASTNode} node AST node (must have a 'type' key)
     * @return {FilterFn}
     */
    compileNode(node) {
        switch (node.type) {
            case 'identity': return this.compileIdentity();
            case 'literal': return this.compileLiteral(node);
            case 'pipe': return this.compilePipe(node);
            case 'label': return this.compileLabel(node);
            case 'break': return this.compileBreak(node);
            case 'variable': return this.compileVariable(node);
            case 'def': return this.compileDef(node);
            case 'call': return this.compileCall(node);
            case 'if': return this.compileIf(node);
            case 'comma': return this.compileComma(node);
            case 'array': return this.compileArray(node);
            case 'object': return this.compileObject(node);
            case 'bind': return this.compileBind(node);
            case 'compare': return this.compileCompare(node);
            case 'and': return this.compileAnd(node);
            case 'or': return this.compileOr(node);
            case 'neg': return this.compileNeg(node);
            case 'iter': return this.compileIter(node);
            case 'alternative': return this.compileAlternative(node);
            case 'try': return this.compileTryCatch(node);
            case 'reduce': return this.compileReduce(node);
            case 'foreach': return this.compileForeach(node);
            case 'slice': return this.compileSlice(node);
            case 'assign': return this.compileAssign(node);
            case 'field': return this.compileField(node);
            case 'index': return this.compileIndex(node);
            case 'string': return this.compileString(node);
            case 'format': return this.compileFormat(node);
            case 'binop': return this.compileBinop(node);
            default:
                assertNever(`unimplemented: ${node.type}`);
        }
    }
    /**
     * Compile an identity node (.).
     * Yields the input value unchanged.
     *
     * @return {FilterFn}
     */
    compileIdentity() {
        return function* (input, env) {
            yield env.maybeWithPath(input);
        };
    }
    /**
     * Compile a literal node (null, true, false, number, plain string).
     * Yields the literal value, ignoring the input.
     *
     * @param {ASTNode} node Node with 'value' key
     * @return {FilterFn}
     */
    compileLiteral(node) {
        const value = node.value;
        return function* (_input, env) {
            yield assertNotPath(value, env);
        };
    }
    /**
     * Compile a pipe node (left | right).
     * Feeds each output of the left filter as input to the right filter,
     * yielding all outputs produced across all intermediate values.
     *
     * @param {ASTNode} node Node with 'left' and 'right' keys
     * @return {FilterFn}
     */
    compilePipe(node) {
        const leftFn = this.compileNode(node.left);
        const rightFn = this.compileNode(node.right);
        return function* (input, env) {
            for (const item of leftFn(input, env)) {
                const [nextEnv, mid] = env.maybeUnwrapPath(item);
                // Re-root: keep env's binding chain but carry nextEnv's accumulated
                // path so the right side extends from the correct position. O(1).
                yield* rightFn(mid, env.leavePathMode().maybeEnterPathMode(nextEnv));
            }
        };
    }
    /**
     * Compile a label node (label $out | body).
     * Evaluates the body, catching any JQBreak whose label matches $out
     * and silently terminating the stream. A break for a different label
     * is re-thrown so it can be caught by the appropriate outer label.
     *
     * @param {ASTNode} node Node with 'name' and 'body' keys
     * @return {FilterFn}
     */
    compileLabel(node) {
        const name = node.name;
        const bodyFn = this.compileNode(node.body);
        return function* (input, env) {
            try {
                yield* bodyFn(input, env);
            }
            catch (e) {
                if (e instanceof JQBreak && e.label === name) ;
                else {
                    throw e;
                }
            }
        };
    }
    /**
     * Compile a break node (break $label).
     * Throws JQBreak when the generator is iterated, terminating the
     * nearest enclosing label node with a matching name.
     *
     * @param {ASTNode} node Node with 'name' key
     * @return {FilterFn}
     */
    compileBreak(node) {
        const name = node.name;
        // eslint-disable-next-line require-yield
        return function* (_input, _env) {
            throw new JQBreak(name);
        };
    }
    /**
     * Compile a variable node ($name).
     * Looks the name up as a 0-arity filter in the runtime env and delegates
     * to it. Variables are bound into the env by compilePattern's var_pattern
     * case; the stored filter ignores its input and yields the captured value.
     *
     * @param {ASTNode} node Node with 'name' key
     * @return {FilterFn}
     */
    compileVariable(node) {
        const key = '$' + node.name;
        return function* (input, env) {
            const fn = env.lookup(key, 0);
            if (fn === null) {
                throw new JQError(`${key} is not defined`);
            }
            for (const val of fn(input, env)) {
                yield assertNotPath(val, env);
            }
        };
    }
    /**
     * Compile a def node (def name(params): body; rest).
     *
     * Value parameters ($x) are desugared at compile time:
     *   def f($x): body  =>  def f(x): x as $x | body
     * so that only filter parameters remain at runtime.
     *
     * Lexical scoping is achieved via a forward reference (defEnvRef):
     * the binding closure captures defEnvRef by reference, which is filled
     * in just before rest is evaluated. This also enables recursion, because
     * any recursive call in body or rest will find the function already bound.
     *
     * For 0-arity defs, the stored value is a plain FilterFn.
     * For n-arity defs, the stored value is a FilterFactory:
     *   (argFns: FilterFn[]) => FilterFn
     * The factory injects the arg closures as 0-arity filter-param bindings
     * into the lexical env, then returns the body filter. Filter args are
     * always evaluated in the call-site env, not the def-body env.
     *
     * @param {ASTNode} node Node with 'name', 'params', 'body', and 'rest' keys
     * @return {FilterFn}
     */
    compileDef(node) {
        const name = node.name;
        const params = node.params;
        const arity = params.length;
        // Desugar value params: wrap body (in reverse param order so the first
        // param binds outermost): def f($x;$y): body → def f(x;y): x as $x | y as $y | body
        let bodyAst = node.body;
        for (const param of [...params].reverse()) {
            if (param.kind === 'value') {
                bodyAst = {
                    type: 'bind',
                    expr: { type: 'call', name: param.name, args: [] },
                    pattern: { type: 'var_pattern', name: param.name },
                    body: bodyAst,
                };
            }
        }
        const bodyFn = this.compileNode(bodyAst);
        const restFn = this.compileNode(node.rest);
        if (arity === 0) {
            return function* (input, env) {
                let defEnvRef = env; // mutable placeholder; overwritten below before first use
                const binding = function* (callInput, callEnv) {
                    // Propagate path mode from the call site into the body so that
                    // structural operations inside the def yield path-wrapped values
                    // when invoked inside path/1.
                    const effectiveEnv = defEnvRef.leavePathMode().maybeEnterPathMode(callEnv);
                    yield* bodyFn(callInput, effectiveEnv);
                };
                const newEnv = env.bind(name, 0, binding);
                defEnvRef = newEnv;
                yield* restFn(input, newEnv);
            };
        }
        // n-arity: store a FilterFactory in the env
        const filterNames = params.map((p) => p.name);
        return function* (input, env) {
            let defEnvRef = env; // mutable placeholder; overwritten below before first use
            const factory = (argFns) => function* (callInput, callEnv) {
                const bodyEnv = filterNames.reduce((benv, pName, i) => {
                    const argFn = argFns[i];
                    return benv.bind(pName, 0, function* (argIn, argEnv) {
                        // Inject each filter param so it evaluates in the call-site env.
                        yield* argFn(argIn, callEnv.leavePathMode()
                            // Re-root: call-site bindings (callEnv) with the path accumulated
                            // so far in the body (argEnv).
                            .maybeEnterPathMode(argEnv));
                    });
                }, 
                // Start from the lexical (normal-mode) env where the def was created.
                defEnvRef.leavePathMode());
                // Propagate path mode from the call site into the body so that
                // structural operations inside the def (identity, field, iter…)
                // yield path-wrapped values when invoked inside path/1.
                yield* bodyFn(callInput, bodyEnv.maybeEnterPathMode(callEnv));
            };
            const newEnv = env.bind(name, arity, factory);
            defEnvRef = newEnv;
            yield* restFn(input, newEnv);
        };
    }
    /**
     * Compile a call node (name or name(arg; ...)).
     *
     * Arg filters are compiled once here at compile time and captured in the
     * returned closure. At runtime:
     *  - 0-arity: the stored value is a plain FilterFn; call it directly.
     *  - n-arity: the stored value is a FilterFactory; pass the compiled arg
     *    closures to get a FilterFn, then run the FilterFn with the call-site env.
     *
     * @param {ASTNode} node Node with 'name' and 'args' keys
     * @return {FilterFn}
     */
    compileCall(node) {
        const name = node.name;
        const args = node.args;
        const arity = args.length;
        const argFns = args.map((arg) => this.compileNode(arg));
        if (arity === 0) {
            return function* (input, env) {
                const fn = env.lookup(name, 0);
                if (fn === null) {
                    throw new JQError(`${name}/0 is not defined`);
                }
                yield* fn(input, env);
            };
        }
        return function* (input, env) {
            const factory = env.lookup(name, arity);
            if (factory === null) {
                throw new JQError(`${name}/${arity} is not defined`);
            }
            yield* factory(argFns)(input, env);
        };
    }
    /**
     * Compile an if node (if cond then body else alt end).
     *
     * The condition is evaluated against the input; for each of its outputs,
     * the then-branch is evaluated if the output is JQ-truthy (anything except
     * null and false), otherwise the else-branch is evaluated. Both branches
     * receive the original input, not the condition's output.
     *
     * elif chains are represented in the AST as a nested if in the else slot.
     * An if without an explicit else has {type:'literal',value:null} as its
     * else node (the grammar's canonical representation).
     *
     * @param {ASTNode} node Node with 'cond', 'then', and 'else' keys
     * @return {FilterFn}
     */
    compileIf(node) {
        const condFn = this.compileNode(node.cond);
        const thenFn = this.compileNode(node.then);
        const elseFn = this.compileNode(node.else);
        return function* (input, env) {
            for (const condVal of condFn(input, env.leavePathMode())) {
                if (toBoolean$1(condVal)) {
                    yield* thenFn(input, env);
                }
                else {
                    yield* elseFn(input, env);
                }
            }
        };
    }
    /**
     * Compile a comma node (left, right).
     * Yields all outputs of the left filter followed by all outputs of the
     * right filter, preserving path-mode wrapping in both halves.
     *
     * @param {ASTNode} node Node with 'left' and 'right' keys
     * @return {FilterFn}
     */
    compileComma(node) {
        const leftFn = this.compileNode(node.left);
        const rightFn = this.compileNode(node.right);
        return function* (input, env) {
            yield* leftFn(input, env);
            yield* rightFn(input, env);
        };
    }
    /**
     * Compile an array constructor node ([expr]).
     * Collects every output of the inner expression into a single JS array.
     * [empty_expr] produces an empty array.
     *
     * @param {ASTNode} node Node with nullable 'expr' key
     * @return {FilterFn}
     */
    compileArray(node) {
        if (node.expr === null) {
            return function* (_input, env) {
                yield assertNotPath([], env);
            };
        }
        const exprFn = this.compileNode(node.expr);
        return function* (input, env) {
            // Array construction always produces a new value, never a path extension.
            const items = [];
            for (const val of exprFn(input, env.leavePathMode())) {
                items.push(val);
            }
            yield assertNotPath(items, env);
        };
    }
    /**
     * Compile an object constructor node ({k1: v1, k2: v2, ...}).
     *
     * Each key and value is an arbitrary filter. Multiple outputs from a key
     * or value expression multiply the number of output objects (Cartesian
     * product over pairs, evaluated left-to-right). An empty pair list yields
     * a single empty object.
     *
     * @param {ASTNode} node Node with 'pairs' key (array of {key, value} nodes)
     * @return {FilterFn}
     */
    compileObject(node) {
        const pairs = node.pairs;
        const pairFns = pairs.map((pair) => [
            this.compileNode(pair.key), this.compileNode(pair.value),
        ]);
        return function* (input, env) {
            const plainEnv = env.leavePathMode();
            let objects = [{}];
            for (const [keyFn, valFn] of pairFns) {
                const next = [];
                for (const obj of objects) {
                    for (const key of keyFn(input, plainEnv)) {
                        for (const val of valFn(input, plainEnv)) {
                            if (typeof key !== 'string' && typeof key !== 'number') {
                                throw new JQError(`Cannot use ${typeName(key)} as object key`);
                            }
                            next.push({ ...obj, [String(key)]: val });
                        }
                    }
                }
                objects = next;
            }
            for (const obj of objects) {
                yield assertNotPath(obj, env);
            }
        };
    }
    /**
     * Compile a bind node: `expr as $pat | body`.
     *
     * For each output of expr, match it against the pattern and evaluate
     * body in the extended environment. Two important points:
     *
     * - Body receives the original $input, not the bound value. This is
     *   what distinguishes "as" from a pipe: . stays the same in body.
     * - $innerEnv flows only into body, never outward. Bindings introduced
     *   here are invisible outside the body, giving correct lexical scoping.
     *
     * @param {ASTNode} node Node with 'expr', 'pattern', and 'body' keys
     * @return {FilterFn}
     */
    compileBind(node) {
        const srcFn = this.compileNode(node.expr);
        const bodyFn = this.compileNode(node.body);
        const patFn = this.compilePattern(node.pattern);
        return function* (input, env) {
            for (const val of srcFn(input, env.leavePathMode())) {
                for (const innerEnv of patFn(val, env)) {
                    yield* bodyFn(input, innerEnv);
                }
            }
        };
    }
    // Recursive helper for obj_pattern matching.
    //
    // For each value yielded by the field's key function, validates it is a
    // string, looks up that field in $val, runs the field's pattern matcher,
    // then recurses into the remaining fields.  Produces one output environment
    // per combination of key values, matching jq's multi-output semantics.
    static *matchObjFields(val, env, fields, idx) {
        if (idx >= fields.length) {
            yield env;
            return;
        }
        const [keyFn, fieldFn] = fields[idx];
        for (const k of keyFn(val, env.leavePathMode())) {
            const fieldName = checkString('object index', k);
            const fieldVal = val[fieldName] ?? null;
            for (const nextEnv of fieldFn(fieldVal, env)) {
                yield* JQCompile.matchObjFields(val, nextEnv, fields, idx + 1);
            }
        }
    }
    // Recursively collect all variable names (with leading $) bound by a pattern.
    static collectPatternVars(pat) {
        switch (pat.type) {
            case 'var_pattern':
                return ['$' + pat.name];
            case 'array_pattern':
                return pat.elems
                    .flatMap((p) => JQCompile.collectPatternVars(p));
            case 'obj_pattern':
                return pat.fields
                    .map((f) => f.pattern)
                    .flatMap((p) => JQCompile.collectPatternVars(p));
            case 'and_pattern':
                return pat.patterns
                    .flatMap((p) => JQCompile.collectPatternVars(p));
            case 'alt_pattern':
                return [...new Set(pat.patterns
                        .flatMap((p) => JQCompile.collectPatternVars(p)))];
            default:
                return [];
        }
    }
    /**
     * Compile a pattern AST node into a Matcher.
     *
     * A Matcher takes (val, env) and yields zero or more extended envs representing
     * successful bindings. Type mismatches should throw JQError so alt_pattern can
     * catch and try the next alternative.
     *
     * @param {ASTNode} pat Pattern node
     * @return {Matcher}
     */
    compilePattern(pat) {
        switch (pat.type) {
            case 'var_pattern': return this.compilePatternVar(pat);
            case 'array_pattern': return this.compilePatternArray(pat);
            case 'obj_pattern': return this.compilePatternObj(pat);
            case 'and_pattern': return this.compilePatternAnd(pat);
            case 'alt_pattern': return this.compilePatternAlt(pat);
            default:
                return assertNever(`Unknown pattern type: ${pat.type}`);
        }
    }
    // Compile a var_pattern ($x): always succeeds, binding the value to $x.
    compilePatternVar(pat) {
        const key = '$' + pat.name;
        return function* (val, env) {
            yield env.bind(key, 0, function* (_input, _env) {
                yield val;
            });
        };
    }
    // Compile an array_pattern ([$a, $b, ...]): checks type, then matches each element.
    compilePatternArray(pat) {
        const elemFns = pat.elems.map((p) => this.compilePattern(p));
        return function* (val, env) {
            const arr = checkArray('array_pattern', val);
            let envs = [env];
            for (let i = 0; i < elemFns.length; i++) {
                const elemFn = elemFns[i];
                const nextEnvs = [];
                for (const currentEnv of envs) {
                    for (const e of elemFn(arr[i] ?? null, currentEnv)) {
                        nextEnvs.push(e);
                    }
                }
                if (nextEnvs.length === 0) {
                    return;
                }
                envs = nextEnvs;
            }
            yield* envs;
        };
    }
    // Compile an obj_pattern ({key: pat, ...}): checks type, then matches each field.
    compilePatternObj(pat) {
        const fields = pat.fields.map((field) => [
            this.compileNode(field.key),
            this.compilePattern(field.pattern),
        ]);
        return function* (val, env) {
            const obj = checkObject('obj_pattern', val);
            yield* JQCompile.matchObjFields(obj, env, fields, 0);
        };
    }
    /**
     * Compile an and_pattern: applies each sub-pattern to the same value,
     * threading the env and accumulating all binding combinations.
     * Generated for {$b: subpat}, which must bind $b AND match subpat.
     *
     * @param {ASTNode} pat Pattern node with 'patterns' key
     * @return {Matcher}
     */
    compilePatternAnd(pat) {
        const patFns = pat.patterns.map((p) => this.compilePattern(p));
        return function* (val, env) {
            let envs = [env];
            for (const patFn of patFns) {
                const nextEnvs = [];
                for (const currentEnv of envs) {
                    for (const e of patFn(val, currentEnv)) {
                        nextEnvs.push(e);
                    }
                }
                if (nextEnvs.length === 0) {
                    return;
                }
                envs = nextEnvs;
            }
            yield* envs;
        };
    }
    /**
     * Compile an alt_pattern (p1 ?// p2 ?// ...): tries each alternative in
     * order, yielding all matches from the first that succeeds. Variables bound only in
     * non-matching alternatives are null-filled in the resulting env.
     *
     * @param {ASTNode} pat Pattern node with 'patterns' key
     * @return {Matcher}
     */
    compilePatternAlt(pat) {
        const altFns = pat.patterns.map((p) => this.compilePattern(p));
        const perAltVars = pat.patterns.map((p) => JQCompile.collectPatternVars(p));
        const allVars = [...new Set(perAltVars.flat())];
        const missingPerAlt = perAltVars.map((altVars) => allVars.filter((v) => !altVars.includes(v)));
        const nullFn = this.compileLiteral({ type: 'literal', value: null });
        return function* (val, env) {
            for (let i = 0; i < altFns.length; i++) {
                try {
                    // Take only the first successful match from each alternative.
                    for (const nextEnv of altFns[i](val, env)) {
                        let finalEnv = nextEnv;
                        // Bind all the missing variables to `null`
                        for (const varName of missingPerAlt[i]) {
                            finalEnv = finalEnv.bind(varName, 0, nullFn);
                        }
                        // Yield the successful matches
                        yield finalEnv;
                    }
                    // Don't advance to next alternative if we've matched
                    return;
                }
                catch (e) {
                    if (e instanceof JQError) ;
                    else {
                        throw e;
                    }
                }
            }
            // all alternatives failed — yield nothing
        };
    }
    /**
     * Compile a compare node (left op right).
     * Both operands are evaluated against the original $input (not piped).
     * Yields one boolean per combination of left and right outputs.
     *
     * @param {ASTNode} node Node with 'op', 'left', and 'right' keys
     * @return {FilterFn}
     */
    compileCompare(node) {
        const leftFn = this.compileNode(node.left);
        const rightFn = this.compileNode(node.right);
        const opStr = node.op;
        let op;
        switch (opStr) {
            case '==':
                op = equal;
                break;
            case '!=':
                op = (lv, rv) => !equal(lv, rv);
                break;
            case '<':
                op = (lv, rv) => compare(lv, rv) < 0;
                break;
            case '<=':
                op = (lv, rv) => compare(lv, rv) <= 0;
                break;
            case '>':
                op = (lv, rv) => compare(lv, rv) > 0;
                break;
            case '>=':
                op = (lv, rv) => compare(lv, rv) >= 0;
                break;
            default:
                assertNever(`Unknown comparison operator: ${opStr}`);
        }
        return function* (input, env) {
            const plainEnv = env.leavePathMode();
            for (const lv of leftFn(input, plainEnv)) {
                for (const rv of rightFn(input, plainEnv)) {
                    yield assertNotPath(op(lv, rv), env);
                }
            }
        };
    }
    /**
     * Compile an 'and' node: `left and right`.
     *
     * Short-circuits: falsy left yields false without evaluating right.
     * Truthy left yields bool(rv) for each output of right.
     *
     * @param {ASTNode} node Node with 'left' and 'right' keys
     * @return {FilterFn}
     */
    compileAnd(node) {
        const leftFn = this.compileNode(node.left);
        const rightFn = this.compileNode(node.right);
        return function* (input, env) {
            const plainEnv = env.leavePathMode();
            for (const lv of leftFn(input, plainEnv)) {
                if (!toBoolean(lv)) {
                    yield assertNotPath(false, env);
                }
                else {
                    for (const rv of rightFn(input, plainEnv)) {
                        yield assertNotPath(toBoolean(rv), env);
                    }
                }
            }
        };
    }
    /**
     * Compile an 'or' node: `left or right`.
     *
     * Short-circuits: truthy left yields true without evaluating right.
     * Falsy left yields bool(rv) for each output of right.
     *
     * @param {ASTNode} node Node with 'left' and 'right' keys
     * @return {FilterFn}
     */
    compileOr(node) {
        const leftFn = this.compileNode(node.left);
        const rightFn = this.compileNode(node.right);
        return function* (input, env) {
            const plainEnv = env.leavePathMode();
            for (const lv of leftFn(input, plainEnv)) {
                if (toBoolean(lv)) {
                    yield assertNotPath(true, env);
                }
                else {
                    for (const rv of rightFn(input, plainEnv)) {
                        yield assertNotPath(toBoolean(rv), env);
                    }
                }
            }
        };
    }
    /**
     * Compile an iterator node (.[] or expr[]?).
     * Iterates over arrays (yielding each element) and objects (yielding each
     * value in insertion order). null and other non-iterable types throw
     * JQError, suppressed to empty output when opt is true.
     *
     * @param {ASTNode} node Node with 'expr' and 'opt' keys
     * @return {FilterFn}
     */
    compileIter(node) {
        const exprFn = this.compileNode(node.expr);
        const opt = node.opt;
        return function* (input, env) {
            for (const item of exprFn(input, env)) {
                const [baseEnv, base] = env.maybeUnwrapPath(item);
                try {
                    if (isObject(base)) {
                        for (const [k, v] of Object.entries(base)) {
                            yield baseEnv.appendPath(k).maybeWithPath(v);
                        }
                    }
                    else if (Array.isArray(base)) {
                        for (let k = 0; k < base.length; k++) {
                            yield baseEnv.appendPath(k).maybeWithPath(base[k]);
                        }
                    }
                    else {
                        throw new JQError(`Cannot iterate over ${typeNameAndValue(base)}`);
                    }
                }
                catch (e) {
                    if (!(opt && (e instanceof JQError))) {
                        throw e;
                    }
                }
            }
        };
    }
    /**
     * Compile a unary negation node (-expr).
     * Yields -v for each numeric value yielded by the inner expression;
     * throws JQError for non-numeric values.
     *
     * @param {ASTNode} node Node with 'expr' key
     * @return {FilterFn}
     */
    compileNeg(node) {
        const exprFn = this.compileNode(node.expr);
        return function* (input, env) {
            const plainEnv = env.leavePathMode();
            for (const v of exprFn(input, plainEnv)) {
                const result = -checkNumber('negation', v);
                yield assertNotPath(result, env);
            }
        };
    }
    /**
     * Compile a field-access node: `expr.name` or `expr.name?`.
     * null input yields null; object input yields the field value (or null if
     * absent); any other type throws JQError (suppressed to empty if opt).
     *
     * @param {ASTNode} node Node with 'expr', 'name', and 'opt' keys
     * @return {FilterFn}
     */
    compileField(node) {
        const exprFn = this.compileNode(node.expr);
        const name = node.name;
        const opt = node.opt;
        return function* (input, env) {
            for (const item of exprFn(input, env)) {
                const [baseEnv, base] = env.maybeUnwrapPath(item);
                if (base === null) {
                    yield baseEnv.appendPath(name).maybeWithPath(null);
                    continue;
                }
                if (opt && (typeof base !== 'object' || Array.isArray(base))) {
                    continue;
                }
                const obj = checkObject('field', base);
                yield baseEnv.appendPath(name).maybeWithPath(obj[name] ?? null);
            }
        };
    }
    /**
     * Compile an index node: `expr[key]` or `expr[key]?`.
     *
     * The key expression is evaluated against the original input (not the base).
     * Supports object indexing by string and array indexing by integer
     * (with negative indices counting from the end). null input yields null.
     *
     * @param {ASTNode} node Node with optional 'expr', required 'key', and 'opt' keys
     * @return {FilterFn}
     */
    compileIndex(node) {
        const exprFn = node.expr !== undefined ?
            this.compileNode(node.expr) : this.compileIdentity();
        const keyFn = this.compileNode(node.key);
        const opt = node.opt;
        return function* (input, env) {
            for (const item of exprFn(input, env)) {
                const [baseEnv, base] = env.maybeUnwrapPath(item);
                // Key is evaluated against the original input, not the base.
                // e.g. in .a[.b], .b is evaluated against the outer input,
                // not against the result of .a.  The key expression is also
                // always evaluated in normal (non-path) mode: the key determines
                // which slot to access; it is not itself a path to collect.
                for (const keyItem of keyFn(input, env.leavePathMode())) {
                    const key = keyItem;
                    if (base === null) {
                        yield baseEnv.appendPath(key).maybeWithPath(null);
                    }
                    else if (typeof base === 'object' && !Array.isArray(base)) {
                        if (opt && typeof key !== 'string') {
                            continue;
                        }
                        const k = checkString('index', key);
                        const obj = base;
                        yield baseEnv.appendPath(k).maybeWithPath(obj[k] ?? null);
                    }
                    else if (Array.isArray(base)) {
                        if (Array.isArray(key)) {
                            // Sub-array search: find all positions where key appears
                            // as a contiguous sub-sequence of base.
                            // Used by builtin.jq's indices/1 definition.
                            const positions = JQCompile.arraySubarraySearch(base, key);
                            yield baseEnv.appendPath(key).maybeWithPath(positions);
                        }
                        else if (opt && !isNumber(key)) {
                            continue;
                        }
                        else {
                            const index = adjustIndex('index', key, base);
                            yield baseEnv.appendPath(key).maybeWithPath(index === null ? null : base[index]);
                        }
                    }
                    else if (!opt) {
                        throw new JQError(`Cannot index ${typeName(base)} with ${typeNameAndValue(key)}`);
                    }
                }
            }
        };
    }
    /**
     * Compile a string node ("text\(expr)text...").
     *
     * Parts alternate between str_text (literal text) and str_interp
     * (expression to evaluate and interpolate). All combinations of
     * interpolated outputs are produced via Cartesian product.
     *
     * If fmt is set (@html, @base64, …), each interpolated segment is
     * formatted before being inserted; literal text parts are left as-is.
     * If fmt is null, interpolated values are converted with tostring
     * semantics (strings pass through; everything else is JSON-encoded).
     *
     * @param {ASTNode} node Node with 'fmt' (null or format name) and 'parts' keys
     * @return {FilterFn}
     */
    compileString(node) {
        const formatter = formatterFor(node.fmt ?? 'text');
        const compiledParts = node.parts.map((part) => {
            if (part.type === 'str_interp') {
                return { kind: 'interp', fn: this.compileNode(part.expr) };
            }
            return { kind: 'text', text: part.text };
        });
        return function* (input, env) {
            const plainEnv = env.leavePathMode();
            let strings = [''];
            for (const part of compiledParts) {
                if (part.kind === 'text') {
                    strings = strings.map((s) => s + part.text);
                }
                else {
                    const next = [];
                    for (const prefix of strings) {
                        for (const val of part.fn(input, plainEnv)) {
                            next.push(prefix + formatter(val));
                        }
                    }
                    strings = next;
                }
            }
            for (const s of strings) {
                yield assertNotPath(s, env);
            }
        };
    }
    /**
     * Compile a standalone format node (@base64, @html, etc.).
     * Applies the named format to the input value directly.
     *
     * @param {ASTNode} node Node with 'fmt' key
     * @return {FilterFn}
     */
    compileFormat(node) {
        const formatter = formatterFor(node.fmt);
        return function* (input, env) {
            yield assertNotPath(formatter(input), env);
        };
    }
    /**
     * Compile a binary operation node: `left op right`.
     *
     * Evaluates both sides against the original input, then applies the
     * operator to each combination of outputs. Right is the outer loop,
     * left is the inner loop (jq semantics).
     *
     * @param {ASTNode} node Node with 'op', 'left', and 'right' keys
     * @return {FilterFn}
     */
    compileBinop(node) {
        const leftFn = this.compileNode(node.left);
        const rightFn = this.compileNode(node.right);
        const opStr = node.op;
        let op;
        switch (opStr) {
            case '+':
                op = add;
                break;
            case '-':
                op = subtract;
                break;
            case '*':
                op = multiply;
                break;
            case '/':
                op = divide;
                break;
            case '%':
                op = modulo;
                break;
            default:
                assertNever(`Unknown operator: ${opStr}`);
        }
        // jq evaluates right first (outer loop) then left (inner loop)
        return function* (input, env) {
            const plainEnv = env.leavePathMode();
            for (const rv of rightFn(input, plainEnv)) {
                for (const lv of leftFn(input, plainEnv)) {
                    yield assertNotPath(op(lv, rv), env);
                }
            }
        };
    }
    /**
     * Compile an alternative node (left // right).
     * Evaluates left; yields all non-false/non-null outputs. If none were
     * yielded, evaluates right and yields all its outputs instead.
     *
     * @param {ASTNode} node Node with 'left' and 'right' keys
     * @return {FilterFn}
     */
    compileAlternative(node) {
        const leftFn = this.compileNode(node.left);
        const rightFn = this.compileNode(node.right);
        return function* (input, env) {
            let found = false;
            for (const item of leftFn(input, env)) {
                const [itemEnv, val] = env.maybeUnwrapPath(item);
                if (toBoolean(val)) {
                    yield itemEnv.maybeWithPath(val);
                    found = true;
                }
            }
            if (!found) {
                yield* rightFn(input, env);
            }
        };
    }
    /**
     * Compile a try-catch node (try body catch handler).
     * Evaluates body; if a JQError is thrown, catches it and either
     * evaluates handler with the error message as input, or produces no
     * output if there is no catch clause.
     *
     * @param {ASTNode} node Node with 'body' and nullable 'catch' keys
     * @return {FilterFn}
     */
    compileTryCatch(node) {
        const bodyFn = this.compileNode(node.body);
        const catchFn = node.catch ? this.compileNode(node.catch) : null;
        return function* (input, env) {
            try {
                yield* bodyFn(input, env);
            }
            catch (e) {
                if (!(e instanceof JQError)) {
                    throw e;
                }
                if (catchFn !== null) {
                    // The catch handler receives the error value, not a path;
                    // always run it in normal mode.
                    yield* catchFn(e.jqValue, env.leavePathMode());
                }
            }
        };
    }
    /**
     * Compile a reduce node (reduce src as $pat (init; update)).
     * Iterates over all outputs of src; for each output, matches the pattern
     * and evaluates update with the current accumulator as input in the
     * extended env. Yields the final accumulator value.
     *
     * @param {ASTNode} node Node with 'src', 'pattern', 'init', and 'update' keys
     * @return {FilterFn}
     */
    compileReduce(node) {
        const srcFn = this.compileNode(node.src);
        const initFn = this.compileNode(node.init);
        const updateFn = this.compileNode(node.update);
        const patFn = this.compilePattern(node.pattern);
        return function* (input, env) {
            const plainEnv = env.leavePathMode();
            for (let acc of initFn(input, plainEnv)) {
                for (const val of srcFn(input, plainEnv)) {
                    for (const boundEnv of patFn(val, plainEnv)) {
                        for (const newAcc of updateFn(acc, boundEnv)) {
                            acc = newAcc;
                            // no break: use the last update value as the new acc
                        }
                        // no break: chain all pattern bindings through the acc
                    }
                }
                yield assertNotPath(acc, env);
            }
        };
    }
    /**
     * Compile a foreach node (foreach src as $pat (init; update[; extract])).
     * Like reduce but yields the accumulator (or extract output) after each step.
     *
     * @param {ASTNode} node Node with 'src', 'pattern', 'init', 'update',
     *   and nullable 'extract' keys
     * @return {FilterFn}
     */
    compileForeach(node) {
        const srcFn = this.compileNode(node.src);
        const initFn = this.compileNode(node.init);
        const updateFn = this.compileNode(node.update);
        const patFn = this.compilePattern(node.pattern);
        const extractFn = node.extract ? this.compileNode(node.extract) : null;
        return function* (input, env) {
            const plainEnv = env.leavePathMode();
            for (let acc of initFn(input, plainEnv)) {
                for (const val of srcFn(input, plainEnv)) {
                    for (const boundEnv of patFn(val, plainEnv)) {
                        // Yield each update value (or its extract); use the last as the
                        // new acc.  If update is empty, acc is unchanged and nothing is
                        // yielded for this step.  Multiple pattern bindings per source
                        // value chain through the accumulator in order.
                        for (const newAcc of updateFn(acc, boundEnv)) {
                            acc = newAcc;
                            if (extractFn !== null) {
                                for (const extracted of extractFn(acc, boundEnv)) {
                                    yield assertNotPath(extracted, env);
                                }
                            }
                            else {
                                yield assertNotPath(acc, env);
                            }
                        }
                    }
                }
            }
        };
    }
    /**
     * Compile a slice node (expr[from:to] or expr[from:to]?).
     * Applies to arrays (returns subarray) and strings (returns substring).
     * Null input yields null; other types throw JQError (suppressed when opt).
     * In path mode, yields a slice-path key alongside the sliced value.
     *
     * @param {ASTNode} node Node with 'expr', 'from', 'to', and 'opt' keys
     * @return {FilterFn}
     */
    compileSlice(node) {
        const exprFn = this.compileNode(node.expr);
        const nullFn = this.compileLiteral({ type: 'literal', value: null });
        const fromFn = node.from ?
            this.compileNode(node.from) : nullFn;
        const toFn = node.to ?
            this.compileNode(node.to) : nullFn;
        const opt = node.opt;
        return function* (input, env) {
            for (const item of exprFn(input, env)) {
                const [baseEnv, base] = env.maybeUnwrapPath(item);
                // from/to bounds are not part of the path; evaluate in normal mode.
                const normalEnv = env.leavePathMode();
                for (const from of fromFn(input, normalEnv)) {
                    for (const to of toFn(input, normalEnv)) {
                        // In path mode yield the slice-path key alongside the
                        // sliced value so that downstream ops (and delpaths) work.
                        const sliceKey = {
                            start: from,
                            end: to,
                        };
                        for (const sliceVal of slice(base, sliceKey.start, sliceKey.end, opt)) {
                            yield baseEnv.appendPath(sliceKey)
                                .maybeWithPath(sliceVal);
                        }
                    }
                }
            }
        };
    }
    /**
     * Compile an assign node (lhs = rhs, lhs |= f, or lhs op= rhs).
     *
     * For plain =:  evaluate rhs against input, then set lhs to each result.
     * For |=:       get the current value at lhs, apply rhs as an update fn, set back.
     * For op= (+=, -=, *=, /=, %=, //=): the RHS is evaluated on the OUTER input
     *   (the input at the time of evaluation), not on the current path value.
     *   "A op= B" means: for each path p in A, set p to (value-at-p) op ($outer | B).
     *   This differs from "A |= . op B" when B references the outer object/array
     *   (e.g. ".foo += .foo" must read .foo from the original input, not from the
     *   scalar value 2 that is the current .foo).
     *
     * @param {ASTNode} node Node with 'op', 'left', and 'right' keys
     * @return {FilterFn}
     */
    compileAssign(node) {
        const op = node.op;
        const lhsNode = node.left;
        const rhsFn = this.compileNode(node.right);
        if (op === '=') {
            return this.compileAssignSet(lhsNode, rhsFn);
        }
        // Compound op= : the RHS is evaluated on the outer input, not the
        // path value, so use a special form for $updateFn which can take
        // the outer input, *and* the current value at the path, and yield
        // a result (which will be written back).
        let binaryOp;
        switch (op) {
            case '+=':
                binaryOp = add;
                break;
            case '-=':
                binaryOp = subtract;
                break;
            case '*=':
                binaryOp = multiply;
                break;
            case '/=':
                binaryOp = divide;
                break;
            case '%=':
                binaryOp = modulo;
                break;
            default:
                binaryOp = null;
                break;
        }
        let updateFn;
        switch (op) {
            case '|=':
                updateFn = function* (_input, current, env) {
                    yield* rhsFn(current, env);
                };
                break;
            case '//=':
                updateFn = function* (input, current, env) {
                    if (toBoolean(current)) {
                        yield current;
                    }
                    else {
                        yield* rhsFn(input, env);
                    }
                };
                break;
            default:
                if (binaryOp === null) {
                    assertNever(`Unknown compound assignment operator: ${op}`);
                }
                updateFn = function* (input, current, env) {
                    for (const r of rhsFn(input, env)) {
                        yield binaryOp(current, assertNotPath(r, env));
                    }
                };
                break;
        }
        return this.compileAssignUpdate(lhsNode, updateFn);
    }
    /**
     * Compile "pathNode = rhsFn": for each value produced by rhsFn, set every
     * path produced by pathNode to that value and yield the updated input.
     *
     * @param {ASTNode} pathNode AST path node (the LHS)
     * @param {FilterFn} rhsFn compiled RHS expression
     * @return {FilterFn}
     */
    compileAssignSet(pathNode, rhsFn) {
        const pathFn = this.compileNode(pathNode);
        return function* (input, env) {
            assertNotPath(input, env);
            const pathEnv = env.enterPathMode();
            for (const newVal of rhsFn(input, env)) {
                let result = input;
                for (const item of pathFn(input, pathEnv)) {
                    result = JQCompile.setAtPath(result, pathEnv.extractPath(item), 0, assertNotPath(newVal, env));
                }
                yield result;
            }
        };
    }
    /**
     * Compile "pathNode |= updateFn": apply updateFn to every slot produced by
     * pathNode and write the result back. Slots where updateFn yields nothing
     * are deleted (jq `|= empty` semantics). Array deletions
     * preserve correct positions.
     *
     * @param {ASTNode} pathNode AST path node (the LHS)
     * @param {Function} updateFn takes (outerInput, currentValue, env), yields replacement
     * @return {FilterFn}
     */
    compileAssignUpdate(pathNode, updateFn) {
        const pathFn = this.compileNode(pathNode);
        return function* (input, env) {
            assertNotPath(input, env);
            const pathEnv = env.enterPathMode();
            const toDelete = [];
            for (const item of pathFn(input, pathEnv)) {
                const path = pathEnv.extractPath(item);
                const current = JQCompile.getAtPath(input, path, 0);
                let hasOutput = false;
                // eslint-disable-next-line no-unreachable-loop
                for (const newVal of updateFn(input, current, env)) {
                    input = JQCompile.setAtPath(input, path, 0, assertNotPath(newVal, env));
                    hasOutput = true;
                    break;
                }
                if (!hasOutput) {
                    toDelete.push(path);
                }
            }
            yield JQCompile.deleteAtPaths(input, toDelete);
        };
    }
    // Find all starting positions in haystack where needle appears as a
    // contiguous sub-sequence. Used by indices/1 via compileIndex.
    static arraySubarraySearch(haystack, needle) {
        const needleLen = needle.length;
        const limit = haystack.length - needleLen;
        const positions = [];
        for (let j = 0; j <= limit; j++) {
            let k = 0;
            for (; k < needleLen; k++) {
                if (compare(haystack[j + k], needle[k]) !== 0) {
                    break;
                }
            }
            if (k === needleLen) {
                positions.push(j);
            }
        }
        return positions;
    }
    /**
     * Navigate to the value at `path` within `val`.
     * null propagates (null[x] → null); out-of-bounds returns null.
     *
     * @param {JQValue} val
     * @param {JQValue[]} path
     * @param {number} offset The current offset into path
     * @return {JQValue} The value at this patch within val
     */
    static getAtPath(val, path, offset) {
        if (offset >= path.length) {
            return val;
        }
        const key = path[offset++];
        if (typeof key === 'string') {
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                const obj = val;
                if (obj[key] !== undefined) {
                    return JQCompile.getAtPath(obj[key], path, offset);
                }
            }
            return null;
        }
        if (isNumber(key)) {
            if (!Array.isArray(val)) {
                return null;
            }
            const idx = adjustIndex('getAtPath', key, val);
            if (idx === null) {
                return null;
            }
            return JQCompile.getAtPath(val[idx], path, offset);
        }
        if (Array.isArray(key)) {
            if (!Array.isArray(val)) {
                return null;
            }
            return JQCompile.getAtPath(JQCompile.arraySubarraySearch(val, key), path, offset);
        }
        return null;
    }
    /**
     * Return `container` with `newVal` written at `path`.
     * Promotes null → [] or stdClass based on key type; fills array gaps with null.
     * Throws JQError for out-of-bounds negative indices and oversized indices.
     *
     * @param {JQValue} container
     * @param {JQValue[]} path
     * @param {number} offset The current offset into $path
     * @param {JQValue} newVal The value we expect to set at the end of the path
     * @return {JQValue}
     */
    static setAtPath(container, path, offset, newVal) {
        if (offset >= path.length) {
            return newVal;
        }
        const key = path[offset++];
        if (typeof key === 'string') {
            if (container === null) {
                // null is promoted to object
                container = {};
            }
            const obj = checkObject('setAtPath', container);
            return {
                ...obj,
                [key]: JQCompile.setAtPath(obj[key] ?? null, path, offset, newVal),
            };
        }
        if (isNumber(key)) {
            if (container === null) {
                // null is promoted to array
                container = [];
            }
            const arr = checkArray('setAtPath', container);
            if (isNaN(key)) {
                throw new JQError('Cannot set array element at NaN index');
            }
            let index = Math.trunc(key);
            if (index < 0) {
                index += arr.length;
            }
            if (index < 0) {
                throw new JQError('Out of bounds negative array index');
            }
            if (index >= MAX_SIZE) {
                throw new JQError('Array index too large');
            }
            const newArr = [...arr];
            while (newArr.length < index) {
                newArr.push(null);
            }
            newArr[index] = JQCompile.setAtPath(arr[index] ?? null, path, offset, newVal);
            return newArr;
        }
        if (Array.isArray(key)) {
            throw new JQError('Cannot update field at array index of array');
        }
        // Slice-path key: { start: ..., end: ... } produced by compileSlice in path mode.
        if (key !== null && typeof key === 'object') {
            const arr = checkArray('setAtPath', container);
            const len = arr.length;
            const keyObj = key;
            const f = normalizeSliceIdx(keyObj.start ?? null, len, 0, true, false);
            const t = normalizeSliceIdx(keyObj.end ?? null, len, len, false, true);
            const repl = Array.isArray(newVal) ? newVal : [];
            const newArr = [...arr];
            newArr.splice(f, Math.max(0, t - f), ...repl);
            return newArr;
        }
        return container;
    }
    /**
     * Return `container` with the slot at each `path` in `paths` removed.
     * Array elements are spliced out (later elements shift left); object keys are unset.
     * Non-existent paths are silently ignored.
     *
     * @param {JQValue} container
     * @param {JQValue[]} paths
     * @return {JQValue}
     */
    static deleteAtPaths(container, paths) {
        let result = container;
        const tombstonePaths = [];
        for (const path of paths) {
            result = JQCompile.deleteAtPath(result, checkArray('delpaths', path), 0, tombstonePaths);
        }
        // Process deepest (longest) paths first so children are compacted before parents.
        tombstonePaths.sort((a, b) => (b.length - a.length) || compare(a, b));
        // Deduplicate and compact each unique tombstone parent path.
        const seen = new Set();
        for (const path of tombstonePaths) {
            const key = JSON.stringify(path);
            if (!seen.has(key)) {
                seen.add(key);
                result = JQCompile.compactAtPath(result, path, 0);
            }
        }
        return result;
    }
    static deleteAtPath(container, path, offset, tombstonePaths) {
        if (offset >= path.length) {
            return null;
        }
        const key = path[offset++];
        if (offset < path.length) {
            // Not at leaf — recurse into the container
            if (typeof key === 'string' && container !== null &&
                typeof container === 'object' && !Array.isArray(container)) {
                const obj = container;
                if (obj[key] === undefined) {
                    return container;
                }
                return {
                    ...obj,
                    [key]: JQCompile.deleteAtPath(obj[key], path, offset, tombstonePaths),
                };
            }
            if (isNumber(key) && Array.isArray(container)) {
                const idx = adjustIndex('deleteAtPath', key, container);
                if (idx !== null && container[idx] !== TOMB) {
                    const newArr = [...container];
                    newArr[idx] = JQCompile.deleteAtPath(container[idx], path, offset, tombstonePaths);
                    return newArr;
                }
            }
            return container;
        }
        // At leaf — delete the key (or replace it with a tombstone)
        if (typeof key === 'string' && container !== null &&
            typeof container === 'object' && !Array.isArray(container)) {
            const obj = container;
            const newObj = { ...obj };
            delete newObj[key];
            return newObj;
        }
        if (isNumber(key) && Array.isArray(container)) {
            const index = adjustIndex('deleteAtPath', key, container);
            if (index !== null && container[index] !== TOMB) {
                const newArr = [...container];
                newArr[index] = TOMB;
                tombstonePaths.push(path.slice(0, -1));
                return newArr;
            }
        }
        if (Array.isArray(key)) {
            throw new JQError('Cannot delete array element of array');
        }
        // Slice-path key: { start: ..., end: ... }
        if (key !== null && typeof key === 'object' && !Array.isArray(key) &&
            Array.isArray(container)) {
            const len = container.length;
            const keyObj = key;
            const f = normalizeSliceIdx(keyObj.start ?? null, len, 0, true, false);
            const t = normalizeSliceIdx(keyObj.end ?? null, len, len, false, true);
            const newArr = [...container];
            let sawTombstone = false;
            for (let i = f; i < t; i++) {
                sawTombstone = sawTombstone || newArr[i] === TOMB;
                newArr[i] = TOMB;
            }
            if (!sawTombstone) {
                // Optimization: If we saw a tombstone, this array is already
                // on the tombstonePaths list.
                tombstonePaths.push(path.slice(0, -1));
            }
            return newArr;
        }
        return container;
    }
    // Remove tombstones from arrays to complete deleteAtPath.
    static compactAtPath(container, path, offset) {
        if (offset >= path.length) {
            const arr = checkArray('compactAtPath', container);
            return arr.filter((v) => v !== TOMB);
        }
        const key = path[offset++];
        if (typeof key === 'string' && container !== null &&
            typeof container === 'object' && !Array.isArray(container)) {
            const obj = container;
            if (obj[key] === undefined) {
                return container;
            }
            return {
                ...obj,
                [key]: JQCompile.compactAtPath(obj[key], path, offset),
            };
        }
        if (isNumber(key) && Array.isArray(container)) {
            const idx = adjustIndex('compactAtPath', key, container);
            if (idx !== null && container[idx] !== TOMB) {
                const newArr = [...container];
                newArr[idx] = JQCompile.compactAtPath(container[idx], path, offset);
                return newArr;
            }
        }
        return container;
    }
}

/**
 * Main entry point for the ZestJQ compiler/evaluator.
 */
class JQ {
    /**
     * Parse and evaluate a jq filter against a JSON input string.
     *
     * @param {string} input The input to the jq filter; must be a valid JSON string.
     * @param {string} filter The jq filter expression
     * @param {string} [filename] Optional source name for the filter expression, used
     *   in syntax-error messages and the $__loc__ built-in.
     * @param {JQEnv} [env] Optional extended environment; see JQEnv.extendEnv().
     * @throws {JQError}
     * @return {Generator<JQValue>}
     */
    static evalString(input, filter, filename, env) {
        return JQ.eval(jsonDecode(input), filter, filename, env);
    }
    /**
     * Parse and evaluate a jq filter against an input value.
     *
     * Note that all arrays must be lists (no string keys); use
     * JQUtils.jsonDecode() to parse JSON into the required format.
     *
     * @param {JQValue} input The input to the jq filter.
     * @param {string} filter The jq filter expression
     * @param {string} [filename] Optional source name for the filter expression, used
     *   in syntax-error messages and the $__loc__ built-in.
     * @param {JQEnv} [env] Optional extended environment; see JQEnv.extendEnv().
     * @throws {JQError}
     * @return {Generator<JQValue>}
     */
    static eval(input, filter, filename, env) {
        return JQ.compile(filter, filename, env)(input);
    }
    /**
     * Parse and compile a jq filter into a reusable function.
     *
     * Compiling once and calling many times is more efficient than calling
     * eval() repeatedly with the same filter.
     *
     * @param {string} filter The jq filter expression
     * @param {string} [filename] Optional source name for the filter expression, used
     *   in syntax-error messages and the $__loc__ built-in.
     * @param {JQEnv} [env] Optional extended environment; see JQEnv.extendEnv().
     * @param {boolean} [deferSyntaxError] If true, any syntax error in the filter is
     *   not thrown until the compiled filter is called against an input.
     * @throws {JQError}
     * @return {JQFilter}
     */
    static compile(filter, filename, env, deferSyntaxError = false) {
        const effectiveFilename = filename ?? filter;
        try {
            const ast = api.parse(filter);
            return JQCompile.compile(ast, env ?? JQEnv.getStdEnv());
        }
        catch (e) {
            if (e instanceof api.SyntaxError) {
                const loc = e.location;
                const locStr = `${loc.start.line}:${loc.start.column}`;
                const msg = `Syntax error in ${effectiveFilename} (${locStr}): ${e.message}`;
                if (deferSyntaxError) {
                    return (_input) => {
                        throw new JQError(msg);
                    };
                }
                throw new JQError(msg);
            }
            throw e;
        }
    }
}

const cache = new Map();
zest.operators['/'] = function(attrVal, jqExpr) {
  let fn = cache.get(jqExpr);
  if (fn === undefined) {
    const compiled = JQ.compile(jqExpr, 'JQ selector');
    fn = (json) => {
      let sawOne = false;
      for (const val of compiled(json)) {
        if (sawOne || toBoolean$1(val)) return true;
        sawOne = true;
      }
      return false;
    };
    cache.set(jqExpr, fn);
  }
  try {
    return fn(jsonDecode(attrVal));
  } catch (_) {
    return false;
  }
};

export { JQ, JQError, JQUtils, zest };
