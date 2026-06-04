import zest from 'zest';
import { JQ, JQError, JQUtils } from 'zestjq';

const cache = new Map();
zest.operators['/'] = function(attrVal, jqExpr) {
  let fn = cache.get(jqExpr);
  if (fn === undefined) {
    const compiled = JQ.compile(jqExpr, 'JQ selector');
    fn = (json) => {
      let sawOne = false;
      for (const val of compiled(json)) {
        if (sawOne || JQUtils.toBoolean(val)) return true;
        sawOne = true;
      }
      return false;
    };
    cache.set(jqExpr, fn);
  }
  try {
    return fn(JQUtils.jsonDecode(attrVal));
  } catch (_) {
    return false;
  }
};

export { zest, JQ, JQError, JQUtils };
