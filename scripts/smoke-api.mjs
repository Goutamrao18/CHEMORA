import assert from "node:assert/strict";
import handler from "../api/assistant.js";

function makeResponse() {
  return {
    statusCode: 200,
    headers: {},
    payload: undefined,
    setHeader(key,value) { this.headers[key]=value; },
    status(code) { this.statusCode=code; return this; },
    json(payload) { this.payload=payload; return this; }
  };
}
async function invoke(req) {
  const res=makeResponse();
  await handler(req,res);
  return res;
}
const originalKey=process.env.OPENROUTER_API_KEY;
delete process.env.OPENROUTER_API_KEY;
try {
  const get=await invoke({method:"GET",headers:{}});
  assert.equal(get.statusCode,405,"non-POST requests should be rejected");
  assert.equal(get.headers["X-Content-Type-Options"],"nosniff");

  const empty=await invoke({method:"POST",headers:{},body:{}});
  assert.equal(empty.statusCode,400,"empty prompt should be rejected");

  const long=await invoke({method:"POST",headers:{},body:{prompt:"x".repeat(4001)}});
  assert.equal(long.statusCode,413,"oversized prompt should be rejected");

  const missingKey=await invoke({method:"POST",headers:{},body:{prompt:"Explain atoms"}});
  assert.equal(missingKey.statusCode,503,"missing provider key should fail safely");
  assert.equal(missingKey.payload.error,"CHEMORA AI is temporarily unavailable.");
  console.log("CHEMORA API smoke tests passed: method, empty input, size limit, missing-key handling.");
} finally {
  if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY=originalKey;
}
