const fs = require('fs');
function makeEl() {
  const el = {
    children: [], classList: { add(){}, remove(){}, toggle(){}, contains(){return false;} },
    style: {}, dataset: {},
    appendChild(child){ this.children.push(child); return child; },
    addEventListener(){}, querySelectorAll(){ return []; }, querySelector(){ return null; },
    setAttribute(){}, getAttribute(){return null;}, remove(){},
  };
  return el;
}
global.document = {
  getElementById(id){ return makeEl(); },
  querySelectorAll(sel){ return []; }, querySelector(sel){ return null; },
  createElement(tag){ return makeEl(); }, addEventListener(){},
};
global.window = { scrollTo(){}, addEventListener(){}, innerWidth: 1200 };
global.navigator = { serviceWorker: undefined };

const code = fs.readFileSync('/home/user/schema/main_script.js', 'utf-8');
const wrapped = code + `
;global.__EXTRACTED2__ = {
  wuduSteps: typeof wuduSteps !== 'undefined' ? wuduSteps : null,
};
`;
eval(wrapped);
fs.writeFileSync('/home/user/schema/extracted_data2.json', JSON.stringify(global.__EXTRACTED2__, null, 2), 'utf-8');
console.log(JSON.stringify(global.__EXTRACTED2__.wuduSteps, null, 2));
