/* ZestJQ integration */
/* globals: zest, ZestJQ */
ZestJQ.Cache = new Map();
function cachedEval( attrVal, jqExpr ) {
	let eval = ZestJQ.Cache.get(jqExpr);
	if (eval === undefined) {
		const jqEval = ZestJQ.JQ.compile( jqExpr, 'JQ selector' );
		eval = function(json) {
			let sawOne = false;
			for( const val of jqEval(json) ) {
				if (sawOne || ZestJQ.JQUtils.toBoolean(val)) {
					return true;
				}
				sawOne = true;
			}
			return false;
		};
		ZestJQ.Cache.set(jqExpr, eval);
	}
	try {
		const val = ZestJQ.JQUtils.jsonDecode( attrVal );
		return eval(val);
	} catch ( e ) {
		// Bad JSON, evaluation error, or halt -- treat as non-matching
		return false;
	}
};
zest.operators['/'] = cachedEval;
