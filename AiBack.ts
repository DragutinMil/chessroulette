(async function(req, res, next) { 
   	console.log('------------------------- ai prompt eval!');
   	console.log('req.vars', req.vars);
   	console.log('req.auth', req.auth);
   	if (!req.auth.user_uuid) { 
   	  res.status(400).json({"message":"Access Denied"});
   	 return; 
   	};
   	const prompt = req.vars.prompt;
   	const system = req.vars.system;
   	
const OpenAI = require('openai');
const client = new OpenAI({apiKey: process.env['OPENAI_API_KEY']});

/*
let r = await db.query(
`select text1 systemprompt from globals where section_name = 'ai-system-prompt-prod'`);
let systemprompt = r[0].systemprompt;
*/

const tools = [{
  "type": "function",
  "name": "get_random_puzzle",
  "description": "Retrieves chess puzzle 'FEN' string and solution array('solution') for the given puzzle theme param",
  "parameters": {
    "type": "object",
    "properties": {
      "theme": {
        "type": "string",
        "enum": [ 
          "Check Mate in 1", 
          "Check Mate in 2", 
          "Check Mate in 3", 
          "Check Mate in 4",
          "Check Mate in 5", 
          "Check Mate in 6",
          "Check Mate in 7",
          "Check-Mate Puzzles",
          "Endgame",
          "Pattern Puzzles"
        ],        
        "description": "puzzle type(theme), e.g. 'Check Mate in 1' "
      }     
    },
    "required": ['theme'],
    "additionalProperties": false
  },
  "strict": true  
}];

let {rows:[{systemprompt}]} = await db.query(
`select text1 systemprompt from globals where section_name = 'ai-system-prompt-prod'`);

let input= [
    { role: 'system', content: systemprompt },
    { role: 'user', content: prompt },
];
  
  
const previous_response_id = req.vars.previous_response_id;

let completion = await client.responses.create({
  model: req.vars.model || 'gpt-4.1',
  tools,
  ...(previous_response_id && {previous_response_id: previous_response_id}),
  input: input
});

//console.log(completion.choices[0].message.content);
console.log('************');
console.dir(completion?.output?.[0]);

const out = completion?.output?.[0];
let fn_resp;
if (out && out.type == 'function_call') {
 let args;
  try {
      args = JSON.parse(out.arguments);
  } catch (e) {
      console.error(e);
  };


  switch (out.name) {
    case "get_random_puzzle":
      console.log(`Calling ${out.name} with arguments: ${JSON.stringify(args)}`);
      try {
      fn_resp = await db.queryByName(`GET_puzzle_random_by_theme`, {vars: {...req.vars, ...args}, auth: req.auth } );
      } catch(e){
        fn_resp = {error:'Daily limit reached!'}
      }
      break;
    default:
      console.log(`Function ${out.name} is not defined.`);
      //res.json({ error:`Function ${out.name} is not defined.` });
  }
  
  if (fn_resp) {
	input.push(out); // append model's function call message
	input.push({                               // append result message
	    type: "function_call_output",
	    call_id: out.call_id,
	    output: JSON.stringify(fn_resp)
	});
	
	completion = await client.responses.create({
	    model: req.vars.model || 'gpt-4.1',
	    tools,
	    input,
	    store: true,
	});  
  }
};


let j;
try {
  j = JSON.parse(completion.output_text) ;
  
  const save = await db.queryByName('INTERNAL_ai_conversation', {
    	  vars: req.vars, auth: req.auth, prompt:prompt, answer:completion
    });
      
} catch (err) {
  j = completion.output_text;
}
res.json({answer: j, id:completion.id, ...(fn_resp && {puzzle:fn_resp})});

})