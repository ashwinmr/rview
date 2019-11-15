#include <napi.h>

// Example function
std::string Hello(std::string inp){
  return "Hello " + inp;
}

// Wrap example function
Napi::String HelloWrapped(const Napi::CallbackInfo& info) 
{
    Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString()) {
      Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
  }

  Napi::String inp = info[0].As<Napi::String>();

  return Napi::String::New(env,Hello(inp));
}

// Initialize function
Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  exports.Set(
    "hello", Napi::Function::New(env, HelloWrapped)
  );

  return exports;
}

// Initialize
NODE_API_MODULE(example_addon, InitAll)
