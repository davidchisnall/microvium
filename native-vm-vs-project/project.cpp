#include <iostream>
#include <fstream>
#include <vector>
#include <filesystem>
#include <stdexcept>

#include "colors.h"
#include "../native-vm/microvium_internals.h"
#include "../native-vm/microvium.h"
#include "yaml-cpp/include/yaml-cpp/yaml.h"
#include "../native-vm-bindings/error_descriptions.hh"

using namespace std;
using namespace filesystem;

// Set to the empty string "" if you want to run all tests
const string runOnlyTest = "object-operations";
//const string runOnlyTest = "";

string testInputDir = "../test/end-to-end/tests/";
string testArtifactsDir = "../test/end-to-end/artifacts/";

vm_TsBytecodeHeader dummy; // Prevent debugger discarding this structure

struct HostFunction {
  vm_HostFunctionID hostFunctionID;
  vm_TfHostFunction hostFunction;
};

struct Context {
  string printout;
};

static int testFail(string message);
static void testPass(string message);
static vm_TeError print(vm_VM* vm, vm_HostFunctionID hostFunctionID, vm_Value* result, vm_Value* args, uint8_t argCount);
static vm_TeError vmAssert(vm_VM* vm, vm_HostFunctionID hostFunctionID, vm_Value* result, vm_Value* args, uint8_t argCount);
static vm_TeError resolveImport(vm_HostFunctionID hostFunctionID, void* context, vm_TfHostFunction* out_hostFunction);

const HostFunction hostFunctions[] = {
  { 1, print },
  { 2, vmAssert },
};

constexpr size_t hostFunctionCount = sizeof hostFunctions / sizeof hostFunctions[0];

int main()
{
  for (const auto entry : directory_iterator(testInputDir)) {
    string pathString = entry.path().string();

    string ext = ".test.mvms";
    size_t indexOfExtension = pathString.rfind(ext);
    size_t indexOfDir = pathString.rfind(testInputDir);
    if (indexOfExtension == string::npos)
      continue; // Not a test case
    size_t truncateFrom = indexOfDir + testInputDir.length();
    string testName = pathString.substr(truncateFrom, indexOfExtension - truncateFrom);

    cout << testName << "... ";

    if (runOnlyTest != "") {
      if (testName != runOnlyTest) {
        cout << "skipping" << endl;
        continue;
      }
    }

    cout << "running" << endl;

    string artifactsDir = testArtifactsDir + testName + "/";

    string yamlFilename = artifactsDir + "0.meta.yaml";
    string bytecodeFilename = artifactsDir + "2.post-gc.mvm-bc";

    // Read bytecode file
    ifstream bytecodeFile(bytecodeFilename, ios::binary | ios::ate);
    if (!bytecodeFile.is_open()) return 1;
    streamsize bytecodeSize = bytecodeFile.tellg();
    uint8_t* bytecode = new uint8_t[(size_t)bytecodeSize];
    bytecodeFile.seekg(0, ios::beg);
    if (!bytecodeFile.read((char*)bytecode, bytecodeSize)) return 1;

    // Create VM
    Context* context = new Context;
    vm_VM* vm;
    check(vm_restore(&vm, bytecode, (uint16_t)bytecodeSize, context, resolveImport));

    YAML::Node meta = YAML::LoadFile(yamlFilename);
    if (meta["runExportedFunction"]) {
      uint16_t runExportedFunctionID = meta["runExportedFunction"].as<uint16_t>();
      cout << "    runExportedFunction: " << runExportedFunctionID << "\n";

      // Resolve exports from VM
      vm_Value exportedFunction;
      check(vm_resolveExports(vm, &runExportedFunctionID, &exportedFunction, 1));
      
      // Invoke exported function
      vm_Value result;
      check(vm_call(vm, exportedFunction, &result, nullptr, 0));
      
      if (meta["expectedPrintout"]) {
        auto expectedPrintout = meta["expectedPrintout"].as<string>();
        if (context->printout == expectedPrintout) {
          testPass("Expected printout matches");
        } else {
          return testFail("Expected printout does not match");
        }
      }
    }

    // vm_runGC(vm);
    vm_free(vm);
    vm = nullptr;
    delete context;
    context = 0;
  }

  return 0;
}

void check(vm_TeError err) {
  if (err != VM_E_SUCCESS) {
    auto errorDescription = errorDescriptions.find(err);
    if (errorDescription != errorDescriptions.end()) {
      throw std::runtime_error(errorDescription->second);
    }
    else {
      throw std::runtime_error(std::string("VM error code: ") + std::to_string(err));
    }
  }
}

int testFail(string message) {
  cout << RED << "    Fail: " << message << RESET << endl;
  return -1;
}

void testPass(string message) {
  cout << GREEN << "    Pass: " << message << RESET << endl;
}

vm_TeError print(vm_VM* vm, vm_HostFunctionID hostFunctionID, vm_Value* result, vm_Value* args, uint8_t argCount) {
  Context* context = (Context*)vm_getContext(vm);
  if (argCount != 1) return VM_E_INVALID_ARGUMENTS;
  string message = vm_toStringUtf8(vm, args[0], NULL);
  cout << "    Prints: " << message << endl;
  if (context->printout != "") context->printout += "\n";
  context->printout += message;

  return VM_E_SUCCESS;
}

vm_TeError vmAssert(vm_VM* vm, vm_HostFunctionID hostFunctionID, vm_Value* result, vm_Value* args, uint8_t argCount) {
  Context* context = (Context*)vm_getContext(vm);
  if (argCount < 2) return VM_E_INVALID_ARGUMENTS;
  bool assertion = vm_toBool(vm, args[0]);
  string message = vm_toStringUtf8(vm, args[1], NULL);
  if (assertion) {
    testPass(message);
  } else {
    testFail(message);
  }

  return VM_E_SUCCESS;
}

vm_TeError resolveImport(vm_HostFunctionID hostFunctionID, void* context, vm_TfHostFunction* out_hostFunction) {
  for (uint16_t i2 = 0; i2 < hostFunctionCount; i2++) {
    if (hostFunctions[i2].hostFunctionID == hostFunctionID) {
      *out_hostFunction = hostFunctions[i2].hostFunction;
      return VM_E_SUCCESS;
    }
  }
  return VM_E_UNRESOLVED_IMPORT;
}