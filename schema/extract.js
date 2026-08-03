// Minimal DOM shim to let the app's <script> run headlessly under Node
// so we can extract its embedded data arrays/objects faithfully.
const fs = require('fs');

function makeEl() {
  const el = {
    children: [],
    classList: { add(){}, remove(){}, toggle(){}, contains(){return false;} },
    style: {},
    dataset: {},
    appendChild(child){ this.children.push(child); return child; },
    addEventListener(){},
    querySelectorAll(){ return []; },
    querySelector(){ return null; },
    setAttribute(){},
    getAttribute(){return null;},
    remove(){},
  };
  return el;
}

global.document = {
  getElementById(id){ return makeEl(); },
  querySelectorAll(sel){ return []; },
  querySelector(sel){ return null; },
  createElement(tag){ return makeEl(); },
  addEventListener(){},
};
global.window = {
  scrollTo(){},
  addEventListener(){},
  innerWidth: 1200,
};
global.navigator = { serviceWorker: undefined };

const code = fs.readFileSync('/home/user/schema/main_script.js', 'utf-8');

// Wrap in a function and expose the vars we want via a return object appended at the end.
const wrapped = code + `
;global.__EXTRACTED__ = {
  allahNames: typeof allahNames !== 'undefined' ? allahNames : null,
  prophetNames: typeof prophetNames !== 'undefined' ? prophetNames : null,
  hadithList: typeof hadithList !== 'undefined' ? hadithList : null,
  qaData: typeof qaData !== 'undefined' ? qaData : null,
  pillarData: typeof pillarData !== 'undefined' ? pillarData : null,
  paraNames: typeof paraNames !== 'undefined' ? paraNames : null,
  paraFileIds: typeof paraFileIds !== 'undefined' ? paraFileIds : null,
};
`;

try {
  eval(wrapped);
} catch (e) {
  console.error("EVAL ERROR:", e.message);
  console.error(e.stack);
  process.exit(1);
}

fs.writeFileSync('/home/user/schema/extracted_data.json', JSON.stringify(global.__EXTRACTED__, null, 2), 'utf-8');
console.log("Done. Counts:");
for (const [k,v] of Object.entries(global.__EXTRACTED__)) {
  console.log(k, Array.isArray(v) ? v.length : typeof v, Array.isArray(v)? '' : (v?Object.keys(v).length:'null'));
}
