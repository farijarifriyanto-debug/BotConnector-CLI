import json, os, time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path

CAP=Path("/home/botadmin/bc-cli-cache-lab/captures")
CAP.mkdir(parents=True, exist_ok=True)

class H(BaseHTTPRequestHandler):
    protocol_version="HTTP/1.1"
    def log_message(self, fmt, *args): pass
    def do_GET(self):
        if self.path.endswith("/models"):
            body=json.dumps({"object":"list","data":[{"id":"ling-3.0-flash","object":"model","owned_by":"mock"}]}).encode()
            self.send_response(200); self.send_header("content-type","application/json"); self.send_header("content-length",str(len(body))); self.end_headers(); self.wfile.write(body); return
        self.send_response(404); self.send_header("content-length","0"); self.end_headers()
    def do_POST(self):
        n=int(self.headers.get("content-length","0"))
        raw=self.rfile.read(n)
        try: body=json.loads(raw)
        except Exception: body={}
        idx=len(list(CAP.glob("req-*.json")))+1
        (CAP/f"req-{idx:03d}.json").write_bytes(raw)
        meta={
            "idx":idx,
            "path":self.path,
            "stream":body.get("stream"),
            "model":body.get("model"),
            "messages":len(body.get("messages",[]) or []),
            "tools":len(body.get("tools",[]) or []),
            "body_bytes":len(raw),
            "headers":{
                "x-session-affinity":self.headers.get("x-session-affinity"),
                "x-session-id":self.headers.get("x-session-id"),
                "user-agent":self.headers.get("user-agent"),
            },
        }
        print(json.dumps(meta), flush=True)
        if body.get("stream"):
            chunks=[
                {"id":"chatcmpl-mock","object":"chat.completion.chunk","created":int(time.time()),"model":body.get("model","ling-3.0-flash"),"choices":[{"index":0,"delta":{"role":"assistant","content":"BOTCONNECTOR_OPENCODE_OK"},"finish_reason":None}]},
                {"id":"chatcmpl-mock","object":"chat.completion.chunk","created":int(time.time()),"model":body.get("model","ling-3.0-flash"),"choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}},
            ]
            payload="".join("data: "+json.dumps(c,separators=(",",":"))+"\n\n" for c in chunks)+"data: [DONE]\n\n"
            data=payload.encode()
            self.send_response(200); self.send_header("content-type","text/event-stream"); self.send_header("cache-control","no-cache"); self.send_header("connection","close"); self.end_headers(); self.wfile.write(data); self.wfile.flush(); self.close_connection=True
        else:
            obj={"id":"chatcmpl-mock","object":"chat.completion","created":int(time.time()),"model":body.get("model","ling-3.0-flash"),"choices":[{"index":0,"message":{"role":"assistant","content":"BOTCONNECTOR_OPENCODE_OK"},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}
            data=json.dumps(obj).encode()
            self.send_response(200); self.send_header("content-type","application/json"); self.send_header("content-length",str(len(data))); self.end_headers(); self.wfile.write(data)

ThreadingHTTPServer(("127.0.0.1",49119),H).serve_forever()
